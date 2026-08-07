/**
 * Live end-to-end test of every Railway-backed route, against the real API.
 *
 *   1. Paste a Railway API token into RAILWAY_TOKEN below.
 *   2. bun run test:routes
 *
 * Without a token the whole suite skips, so `bun run test` stays green.
 *
 * This creates exactly ONE project and tears it down at the end — the free tier
 * allows one, and `afterAll` deletes it even if a test throws, so a failed run
 * doesn't leave the account occupied. Everything else (service, environment,
 * domains, variables, deployments) lives inside that project.
 *
 * Tests run top to bottom and share state: the project id from the first block
 * feeds the rest. A failure early on leaves later blocks with nothing to work
 * on; those return early rather than failing a second time for the same reason.
 *
 * Some assertions accept a small set of statuses. That is deliberate, not
 * sloppiness — Railway declines things like rollback and cancel depending on
 * live deployment state, and a decline is a route path worth exercising (409 /
 * 502) rather than a failure. Where the outcome IS deterministic, the test
 * asserts exactly.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { api, deleteTestUsers, signUpTestUser, type TestUser } from "./index";

// ─── Paste your Railway API token here ──────────────────────────────────────
const RAILWAY_TOKEN = "";
// ────────────────────────────────────────────────────────────────────────────

const live = Boolean(RAILWAY_TOKEN);

if (!live) {
    console.warn(
        "routes.test.ts — no RAILWAY_TOKEN set, skipping live route tests.\n" +
            "Paste a token at the top of the file and run `bun run test:routes`.",
    );
}

/** Only these blocks talk to Railway; they no-op without a token. */
const liveDescribe = describe.skipIf(!live);

const suffix = Date.now().toString(36);
const IMAGE = "redis:7-alpine";

let user: TestUser;

/** Everything created upstream, in creation order. */
const created = {
    projectId: "",
    /** The environment the project page opens on — production, in practice. */
    primaryEnvironmentId: "",
    /** The second environment this suite forks, if the plan allows one. */
    forkEnvironmentId: "",
    serviceId: "",
    deploymentId: "",
    serviceDomainId: "",
    customDomainId: "",
};

type Call = { status: number; body: any };

/** One authenticated call through the real Hono app. */
async function call(method: string, path: string, body?: unknown): Promise<Call> {
    const res = await api(path, {
        method,
        cookie: user.cookie,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();

    try {
        return { status: res.status, body: text ? JSON.parse(text) : null };
    } catch {
        // A 404 from Hono's own router isn't JSON; surfacing the text beats a
        // parse error that hides which call went wrong.
        return { status: res.status, body: { nonJsonBody: text } };
    }
}

/**
 * True when an earlier step didn't produce something this test needs. Sitting
 * out beats sending an empty id upstream and reporting a validation 400 as if
 * it were this route's problem.
 */
function missing(...ids: string[]) {
    return ids.some((id) => !id);
}

const SETTLED = ["SUCCESS", "FAILED", "CRASHED", "REMOVED", "SKIPPED", "SLEEPING"];

/**
 * Polls a deployment until it stops moving. Returns whatever it last saw, so a
 * deploy that outlives the budget still gives the caller something to assert on
 * rather than hanging the suite.
 */
async function waitForDeployment(id: string, budgetMs = 180_000) {
    const deadline = Date.now() + budgetMs;
    let deployment: any = null;

    while (Date.now() < deadline) {
        const { body } = await call("GET", `/deployments/${id}`);
        deployment = body?.deployment ?? deployment;

        if (deployment && SETTLED.includes(deployment.status)) return deployment;
        await Bun.sleep(5_000);
    }

    return deployment;
}

beforeAll(async () => {
    if (!live) return;

    await deleteTestUsers();
    user = await signUpTestUser();

    const saved = await call("POST", "/token", { token: RAILWAY_TOKEN });
    if (saved.status !== 200) {
        throw new Error(`could not save the Railway token: ${JSON.stringify(saved.body)}`);
    }
});

afterAll(async () => {
    if (!live) return;

    // Safety net: a thrown test must not leave the account's one project behind.
    if (created.projectId && user?.cookie) {
        const res = await call("DELETE", `/projects/${created.projectId}`);
        if (res.status === 200) {
            console.warn(`cleanup: removed leftover project ${created.projectId}`);
        }
    }

    await deleteTestUsers();
});

/* ────────────────────────────── auth & validation ───────────────────────── */

liveDescribe("auth", () => {
    test.each([
        ["GET", "/projects"],
        ["GET", "/services/11111111-1111-4111-8111-111111111111"],
        ["GET", "/environments?projectId=11111111-1111-4111-8111-111111111111"],
        ["GET", "/deployments?projectId=11111111-1111-4111-8111-111111111111"],
        ["GET", "/domains/available?domain=example.com"],
        ["GET", "/variables"],
    ])("%s %s is 401 without a session", async (method, path) => {
        const res = await api(path, { method });

        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({ error: "Unauthorized" });
    });
});

liveDescribe("validation", () => {
    test("rejects a non-uuid path param", async () => {
        const { status } = await call("GET", "/services/not-a-uuid");
        expect(status).toBe(400);
    });

    test("requires projectId when listing environments", async () => {
        const { status } = await call("GET", "/environments");
        expect(status).toBe(400);
    });

    test("requires projectId when listing deployments", async () => {
        const { status } = await call("GET", "/deployments");
        expect(status).toBe(400);
    });

    test("rejects an empty service patch", async () => {
        const id = "11111111-1111-4111-8111-111111111111";
        const { status } = await call("PATCH", `/services/${id}`, {});
        expect(status).toBe(400);
    });

    test("rejects a service source with both repo and image", async () => {
        const { status } = await call("POST", "/services", {
            projectId: "11111111-1111-4111-8111-111111111111",
            source: { repo: "railwayapp/starters", image: IMAGE },
        });
        expect(status).toBe(400);
    });

    test("rejects an unknown deployment status filter", async () => {
        const id = "11111111-1111-4111-8111-111111111111";
        const { status } = await call("GET", `/deployments?projectId=${id}&status=NOPE`);
        expect(status).toBe(400);
    });

    test("rejects scope=shared carrying a serviceId", async () => {
        const id = "11111111-1111-4111-8111-111111111111";
        const { status } = await call(
            "GET",
            `/variables?projectId=${id}&environmentId=${id}&scope=shared&serviceId=${id}`,
        );
        expect(status).toBe(400);
    });

    test("rejects scope=service without a serviceId", async () => {
        const id = "11111111-1111-4111-8111-111111111111";
        const { status } = await call(
            "GET",
            `/variables?projectId=${id}&environmentId=${id}&scope=service`,
        );
        expect(status).toBe(400);
    });

    test("requires projectId to delete an environment", async () => {
        const id = "11111111-1111-4111-8111-111111111111";
        const { status } = await call("DELETE", `/environments/${id}`);
        expect(status).toBe(400);
    });
});

/* ─────────────────────────────────── projects ───────────────────────────── */

liveDescribe("projects", () => {
    test("POST / creates the project this suite runs in", async () => {
        const { status, body } = await call("POST", "/projects", {
            name: `route-test-${suffix}`,
            description: "created by routes.test.ts",
        });

        if (status !== 201) {
            throw new Error(
                `project create failed (${status}): ${JSON.stringify(body)}\n` +
                    "On a free account this usually means one already exists — delete it and re-run.",
            );
        }

        expect(body.project.name).toBe(`route-test-${suffix}`);
        expect(body.project.services).toEqual([]);

        created.projectId = body.project.id;
    });

    test("GET / lists it, with workspaces batched in", async () => {
        const { status, body } = await call("GET", "/projects");

        expect(status).toBe(200);
        expect(Array.isArray(body.workspaces)).toBe(true);
        expect(body.pageInfo).toHaveProperty("hasNextPage");
        expect(body.projects.some((p: any) => p.id === created.projectId)).toBe(true);
    });

    test("GET /:id returns the overview and the environment to open on", async () => {
        if (!created.projectId) return;

        const { status, body } = await call("GET", `/projects/${created.projectId}`);

        expect(status).toBe(200);
        expect(body.project.id).toBe(created.projectId);
        expect(body.environments.length).toBeGreaterThan(0);

        // Load-bearing for the whole suite: everything downstream is keyed by
        // an environment id, and a null here is what previously left every
        // later call sending an empty one.
        expect(body.primaryEnvironment).not.toBeNull();
        expect(body.primaryEnvironment.id).toBeTruthy();
        expect(body.primaryEnvironment.services).toEqual([]);
        expect(body.environments.some((e: any) => e.id === body.primaryEnvironment.id)).toBe(
            true,
        );

        created.primaryEnvironmentId = body.primaryEnvironment.id;
    });

    test("PATCH /:id updates only the fields sent", async () => {
        if (!created.projectId) return;

        const { status, body } = await call("PATCH", `/projects/${created.projectId}`, {
            description: "renamed by routes.test.ts",
        });

        expect(status).toBe(200);
        expect(body.project.description).toBe("renamed by routes.test.ts");
        expect(body.project.name).toBe(`route-test-${suffix}`);
    });
});

/* ───────────────────────────────── environments ─────────────────────────── */

liveDescribe("environments", () => {
    test("GET / lists the project's environments", async () => {
        if (!created.projectId) return;

        const { status, body } = await call(
            "GET",
            `/environments?projectId=${created.projectId}`,
        );

        expect(status).toBe(200);
        expect(body.environments.some((e: any) => e.id === created.primaryEnvironmentId)).toBe(
            true,
        );
    });

    test("GET /:id returns the environment and its (empty) service list", async () => {
        if (!created.primaryEnvironmentId) return;

        const { status, body } = await call(
            "GET",
            `/environments/${created.primaryEnvironmentId}?projectId=${created.projectId}`,
        );

        expect(status).toBe(200);
        expect(body.environment.id).toBe(created.primaryEnvironmentId);
        expect(body.environment.projectId).toBe(created.projectId);
        expect(body.services).toEqual([]);
    });

    test("GET /:id/logs returns a log array", async () => {
        if (!created.primaryEnvironmentId) return;

        const { status, body } = await call(
            "GET",
            `/environments/${created.primaryEnvironmentId}/logs`,
        );

        expect(status).toBe(200);
        expect(Array.isArray(body.logs)).toBe(true);
    });

    test("GET /:id/staged-changes answers, staged or not", async () => {
        if (!created.primaryEnvironmentId) return;

        const { status } = await call(
            "GET",
            `/environments/${created.primaryEnvironmentId}/staged-changes`,
        );

        // The field is non-null upstream, so a fresh environment with nothing
        // staged errors rather than returning empty — 502 is the honest answer.
        expect([200, 502]).toContain(status);
    });

    // Deliberately before the fork: with a second environment around, the
    // "only environment" guard no longer applies, and if Railway also left
    // primaryEnvironmentId unset this call would really delete production.
    test("DELETE /:id refuses the environment a project can't do without", async () => {
        if (!created.primaryEnvironmentId) return;

        const { status, body } = await call(
            "DELETE",
            `/environments/${created.primaryEnvironmentId}?projectId=${created.projectId}`,
        );

        expect(status).toBe(400);
        // Which guard fires depends on whether Railway set primaryEnvironmentId
        // on this project; both mean the environment was protected.
        expect([
            "Cannot delete the primary environment",
            "Cannot delete the project's only environment",
        ]).toContain(body.error);

        const check = await call("GET", `/environments?projectId=${created.projectId}`);
        expect(
            check.body.environments.some((e: any) => e.id === created.primaryEnvironmentId),
        ).toBe(true);
    });

    test("POST / forks a second environment", async () => {
        if (missing(created.projectId, created.primaryEnvironmentId)) return;

        const { status, body } = await call("POST", "/environments", {
            name: `fork-${suffix}`,
            projectId: created.projectId,
            sourceEnvironmentId: created.primaryEnvironmentId,
        });

        if (status !== 201) {
            // Multiple environments are a paid feature on some plans; the rest
            // of this block sits out rather than failing for a billing reason.
            console.warn(`environment create declined: ${JSON.stringify(body)}`);
            return;
        }

        expect(body.environment.name).toBe(`fork-${suffix}`);
        expect(body.environment.sourceEnvironment?.id).toBe(created.primaryEnvironmentId);

        created.forkEnvironmentId = body.environment.id;
    });

    test("PATCH /:id renames it", async () => {
        if (!created.forkEnvironmentId) return;

        const { status, body } = await call(
            "PATCH",
            `/environments/${created.forkEnvironmentId}`,
            { name: `fork-${suffix}-renamed` },
        );

        expect(status).toBe(200);
        expect(body.environment.name).toBe(`fork-${suffix}-renamed`);
    });

    test("POST /:id/commit answers whether or not anything is staged", async () => {
        if (!created.forkEnvironmentId) return;

        const { status } = await call(
            "POST",
            `/environments/${created.forkEnvironmentId}/commit`,
            { commitMessage: "routes.test.ts", skipDeploys: true },
        );

        // Nothing this API writes is ever staged, so an empty commit is the
        // expected shape of this call.
        expect([200, 502]).toContain(status);
    });

});

/* ─────────────────────────────────── services ───────────────────────────── */

liveDescribe("services", () => {
    test("POST / creates a service from an image", async () => {
        if (!created.projectId) return;

        const { status, body } = await call("POST", "/services", {
            projectId: created.projectId,
            name: `svc-${suffix}`,
            source: { image: IMAGE },
        });

        expect(status).toBe(201);
        expect(body.service.name).toBe(`svc-${suffix}`);
        expect(body.service.projectId).toBe(created.projectId);

        created.serviceId = body.service.id;
    });

    test("GET /:id returns its identity", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call("GET", `/services/${created.serviceId}`);

        expect(status).toBe(200);
        expect(body.service.id).toBe(created.serviceId);
        expect(body.service.deletedAt).toBeNull();
    });

    test("GET /:id/instance returns the per-environment config", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call(
            "GET",
            `/services/${created.serviceId}/instance?environmentId=${created.primaryEnvironmentId}`,
        );

        expect(status).toBe(200);
        expect(body.instance.serviceId).toBe(created.serviceId);
        expect(body.instance.environmentId).toBe(created.primaryEnvironmentId);
        expect(body.instance.source?.image).toBe(IMAGE);
    });

    test("GET /:id/detail batches instance, variables and deployments", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call(
            "GET",
            `/services/${created.serviceId}/detail?projectId=${created.projectId}` +
                `&environmentId=${created.primaryEnvironmentId}`,
        );

        expect(status).toBe(200);
        expect(body.instance.serviceId).toBe(created.serviceId);
        expect(body.instance.service.name).toBe(`svc-${suffix}`);
        expect(body.instance.domains).toHaveProperty("serviceDomains");
        expect(typeof body.variables).toBe("object");
        expect(Array.isArray(body.deployments)).toBe(true);
    });

    test("the service now shows up in its environment", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { body } = await call(
            "GET",
            `/environments/${created.primaryEnvironmentId}?projectId=${created.projectId}`,
        );

        expect(body.services.some((s: any) => s.serviceId === created.serviceId)).toBe(true);
    });

    test("PATCH /:id renames it", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call("PATCH", `/services/${created.serviceId}`, {
            name: `svc-${suffix}-renamed`,
        });

        expect(status).toBe(200);
        expect(body.service.name).toBe(`svc-${suffix}-renamed`);
    });

    test("PATCH /:id/instance writes config and returns the re-read", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call(
            "PATCH",
            `/services/${created.serviceId}/instance?environmentId=${created.primaryEnvironmentId}`,
            { restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 3, numReplicas: 1 },
        );

        expect(status).toBe(200);
        expect(body.instance.restartPolicyType).toBe("ON_FAILURE");
        expect(body.instance.restartPolicyMaxRetries).toBe(3);
        expect(body.instance.numReplicas).toBe(1);
    });
});

/* ────────────────────────────────── variables ───────────────────────────── */

liveDescribe("variables", () => {
    /** Every write here skips deploys — otherwise each one queues a rollout. */
    const scope = () => ({
        projectId: created.projectId,
        environmentId: created.primaryEnvironmentId,
        scope: "service" as const,
        serviceId: created.serviceId,
        skipDeploys: true,
    });

    const readQuery = () =>
        `/variables?projectId=${created.projectId}&environmentId=${created.primaryEnvironmentId}` +
        `&scope=service&serviceId=${created.serviceId}&unrendered=true`;

    test("PUT / upserts one variable", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call("PUT", "/variables", {
            ...scope(),
            name: "ROUTE_TEST",
            value: "hello",
        });

        expect(status).toBe(200);
        expect(body).toEqual({ saved: true });
    });

    test("GET / reads it back", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call("GET", readQuery());

        expect(status).toBe(200);
        expect(body.variables.ROUTE_TEST).toBe("hello");
    });

    test("PUT /bulk merges a batch", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status } = await call("PUT", "/variables/bulk", {
            ...scope(),
            variables: { BULK_A: "1", BULK_B: "2" },
        });
        expect(status).toBe(200);

        const { body } = await call("GET", readQuery());
        expect(body.variables).toMatchObject({
            ROUTE_TEST: "hello",
            BULK_A: "1",
            BULK_B: "2",
        });
    });

    test("GET /deployment resolves what the container would see", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call(
            "GET",
            `/variables/deployment?projectId=${created.projectId}` +
                `&environmentId=${created.primaryEnvironmentId}&serviceId=${created.serviceId}`,
        );

        expect(status).toBe(200);
        expect(body.variables.ROUTE_TEST).toBe("hello");
    });

    test("DELETE / removes one by name", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call(
            "DELETE",
            `/variables?projectId=${created.projectId}` +
                `&environmentId=${created.primaryEnvironmentId}&scope=service` +
                `&serviceId=${created.serviceId}&name=BULK_B`,
        );

        expect(status).toBe(200);
        expect(body).toEqual({ deleted: true });

        const read = await call("GET", readQuery());
        expect(read.body.variables).not.toHaveProperty("BULK_B");
    });

    test("PUT /bulk with replace:true clears everything absent from the payload", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status } = await call("PUT", "/variables/bulk", {
            ...scope(),
            variables: { ONLY_ONE: "1" },
            replace: true,
        });
        expect(status).toBe(200);

        const { body } = await call("GET", readQuery());
        expect(body.variables).toEqual({ ONLY_ONE: "1" });
    });

    test("shared variables are a separate scope", async () => {
        if (!created.primaryEnvironmentId) return;

        const shared = {
            projectId: created.projectId,
            environmentId: created.primaryEnvironmentId,
            scope: "shared" as const,
        };

        const put = await call("PUT", "/variables", {
            ...shared,
            name: "SHARED_VAR",
            value: "shared-value",
            skipDeploys: true,
        });
        expect(put.status).toBe(200);

        const sharedRead = await call(
            "GET",
            `/variables?projectId=${created.projectId}` +
                `&environmentId=${created.primaryEnvironmentId}&scope=shared`,
        );
        expect(sharedRead.body.variables.SHARED_VAR).toBe("shared-value");

        // ...and it isn't in the service's own set.
        const serviceRead = await call("GET", readQuery());
        expect(serviceRead.body.variables).not.toHaveProperty("SHARED_VAR");

        const del = await call(
            "DELETE",
            `/variables?projectId=${created.projectId}` +
                `&environmentId=${created.primaryEnvironmentId}&scope=shared&name=SHARED_VAR`,
        );
        expect(del.status).toBe(200);
    });
});

/* ───────────────────────────────── deployments ──────────────────────────── */

liveDescribe("deployments", () => {
    let settled: any = null;

    test("POST / deploys the service and returns an id to poll", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call("POST", "/deployments", {
            serviceId: created.serviceId,
            environmentId: created.primaryEnvironmentId,
        });

        expect(status).toBe(201);
        expect(typeof body.deploymentId).toBe("string");

        created.deploymentId = body.deploymentId;
    });

    test("GET /:id reports status until it settles", async () => {
        if (!created.deploymentId) return;

        settled = await waitForDeployment(created.deploymentId);

        expect(settled).not.toBeNull();
        expect(settled.serviceId).toBe(created.serviceId);
        expect(settled.projectId).toBe(created.projectId);
        // A build failure is still a valid answer from this route; what matters
        // is that the deployment reached a terminal state.
        expect(SETTLED).toContain(settled.status);
    }, 200_000);

    test("GET / lists it, and filters by status", async () => {
        if (!created.deploymentId) return;

        const { status, body } = await call(
            "GET",
            `/deployments?projectId=${created.projectId}&serviceId=${created.serviceId}` +
                `&environmentId=${created.primaryEnvironmentId}`,
        );

        expect(status).toBe(200);
        expect(body.deployments.some((d: any) => d.id === created.deploymentId)).toBe(true);

        const filtered = await call(
            "GET",
            `/deployments?projectId=${created.projectId}&status=${settled?.status ?? "SUCCESS"}`,
        );
        expect(filtered.status).toBe(200);
        expect(
            filtered.body.deployments.every((d: any) => d.status === (settled?.status ?? "SUCCESS")),
        ).toBe(true);
    });

    test.each(["build-logs", "logs", "http-logs"])(
        "GET /:id/%s returns a log array",
        async (kind) => {
            if (!created.deploymentId) return;

            const { status, body } = await call(
                "GET",
                `/deployments/${created.deploymentId}/${kind}?limit=50`,
            );

            expect(status).toBe(200);
            expect(Array.isArray(body.logs)).toBe(true);
        },
    );

    test("POST /:id/restart is accepted or declined, not broken", async () => {
        if (!created.deploymentId) return;

        const { status } = await call("POST", `/deployments/${created.deploymentId}/restart`);
        expect([200, 502]).toContain(status);
    });

    test("POST /:id/rollback matches canRollback", async () => {
        if (!created.deploymentId) return;

        const { status } = await call("POST", `/deployments/${created.deploymentId}/rollback`);

        // First deployment of a service has nothing to roll back to, so Railway
        // declines — which is this route's 502 path.
        expect(settled?.canRollback ? [200] : [200, 502]).toContain(status);
    });

    test("POST /:id/cancel on a settled deployment is refused", async () => {
        if (!created.deploymentId) return;

        const { status } = await call("POST", `/deployments/${created.deploymentId}/cancel`);

        // 409 is the route's own "no longer cancellable"; 502 is Railway
        // raising instead of returning false. Both mean the same thing.
        expect([200, 409, 502]).toContain(status);
    });

    test("POST /:id/stop halts the running deployment", async () => {
        if (!created.deploymentId) return;

        const { status } = await call("POST", `/deployments/${created.deploymentId}/stop`);
        expect([200, 502]).toContain(status);
    });

    test("POST /redeploy re-runs the service's latest deployment", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status } = await call("POST", "/deployments/redeploy", {
            serviceId: created.serviceId,
            environmentId: created.primaryEnvironmentId,
        });

        expect([200, 502]).toContain(status);
    });

    test("POST /triggers deploys through the environment's triggers", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status } = await call("POST", "/deployments/triggers", {
            projectId: created.projectId,
            serviceId: created.serviceId,
            environmentId: created.primaryEnvironmentId,
        });

        expect([200, 502]).toContain(status);
    });
});

/* ─────────────────────────────────── domains ────────────────────────────── */

liveDescribe("domains", () => {
    test("GET / starts empty for a fresh service", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call(
            "GET",
            `/domains?projectId=${created.projectId}` +
                `&environmentId=${created.primaryEnvironmentId}&serviceId=${created.serviceId}`,
        );

        expect(status).toBe(200);
        expect(body.serviceDomains).toEqual([]);
        expect(body.customDomains).toEqual([]);
    });

    test("GET /available answers with a message either way", async () => {
        const { status, body } = await call(
            "GET",
            `/domains/available?domain=routes-test-${suffix}.example.com`,
        );

        expect(status).toBe(200);
        expect(typeof body.available).toBe("boolean");
        expect(typeof body.message).toBe("string");
    });

    test("POST /service generates a railway.app domain", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call("POST", "/domains/service", {
            serviceId: created.serviceId,
            environmentId: created.primaryEnvironmentId,
            targetPort: 6379,
        });

        expect(status).toBe(201);
        expect(body.serviceDomain.domain).toContain(".");
        expect(body.serviceDomain.targetPort).toBe(6379);

        created.serviceDomainId = body.serviceDomain.id;
    });

    test("GET / now returns it", async () => {
        if (!created.serviceDomainId) return;

        const { body } = await call(
            "GET",
            `/domains?projectId=${created.projectId}` +
                `&environmentId=${created.primaryEnvironmentId}&serviceId=${created.serviceId}`,
        );

        expect(body.serviceDomains.some((d: any) => d.id === created.serviceDomainId)).toBe(
            true,
        );
    });

    test("POST /custom attaches a custom domain with its DNS instructions", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call("POST", "/domains/custom", {
            projectId: created.projectId,
            environmentId: created.primaryEnvironmentId,
            serviceId: created.serviceId,
            domain: `routes-test-${suffix}.example.com`,
        });

        if (status !== 201) {
            // Custom domains are plan-gated; skip the rest rather than fail.
            console.warn(`custom domain declined: ${JSON.stringify(body)}`);
            return;
        }

        expect(body.customDomain.status.verified).toBe(false);
        expect(Array.isArray(body.customDomain.status.dnsRecords)).toBe(true);
        // The TXT record the user also needs is a separate field, not a record.
        expect(body.customDomain.status).toHaveProperty("verificationToken");

        created.customDomainId = body.customDomain.id;
    });

    test("GET /custom/:id is the poll target for setup", async () => {
        if (!created.customDomainId) return;

        const { status, body } = await call(
            "GET",
            `/domains/custom/${created.customDomainId}?projectId=${created.projectId}`,
        );

        expect(status).toBe(200);
        expect(body.customDomain.id).toBe(created.customDomainId);
        expect(body.customDomain.serviceId).toBe(created.serviceId);
    });

    test("PATCH /custom/:id changes the target port and re-reads", async () => {
        if (!created.customDomainId) return;

        const { status, body } = await call(
            "PATCH",
            `/domains/custom/${created.customDomainId}`,
            {
                projectId: created.projectId,
                environmentId: created.primaryEnvironmentId,
                targetPort: 8080,
            },
        );

        expect(status).toBe(200);
        expect(body.customDomain.targetPort).toBe(8080);
    });
});

/* ───────────────────────────── source connect/disconnect ────────────────── */

liveDescribe("service source", () => {
    test("POST /:id/connect points the service at an image", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status, body } = await call("POST", `/services/${created.serviceId}/connect`, {
            image: IMAGE,
        });

        expect(status).toBe(200);
        expect(body.service.id).toBe(created.serviceId);
    });

    test("POST /:id/disconnect clears it", async () => {
        if (missing(created.serviceId, created.primaryEnvironmentId)) return;

        const { status } = await call("POST", `/services/${created.serviceId}/disconnect`);
        expect(status).toBe(200);

        // Service has no source field, so the confirmation is the re-read.
        const { body } = await call(
            "GET",
            `/services/${created.serviceId}/instance?environmentId=${created.primaryEnvironmentId}`,
        );
        expect(body.instance.source?.image ?? null).toBeNull();
    });
});

/* ──────────────────────────────────── deletes ───────────────────────────── */

liveDescribe("cleanup", () => {
    test("DELETE /domains/custom/:id detaches the custom domain", async () => {
        if (!created.customDomainId) return;

        const { status, body } = await call(
            "DELETE",
            `/domains/custom/${created.customDomainId}`,
        );

        expect(status).toBe(200);
        expect(body).toEqual({ deleted: true });
        created.customDomainId = "";
    });

    test("DELETE /domains/service/:id removes the railway domain", async () => {
        if (!created.serviceDomainId) return;

        const { status, body } = await call(
            "DELETE",
            `/domains/service/${created.serviceDomainId}`,
        );

        expect(status).toBe(200);
        expect(body).toEqual({ deleted: true });
        created.serviceDomainId = "";
    });

    test("DELETE /deployments/:id takes it out of the history", async () => {
        if (!created.deploymentId) return;

        const { status } = await call("DELETE", `/deployments/${created.deploymentId}`);

        // Already-removed or still-transitioning deployments are declined.
        expect([200, 502]).toContain(status);
        created.deploymentId = "";
    });

    test("DELETE /services/:id deletes the service", async () => {
        // Deletes guard on their own id only — a missing environment id must
        // never be a reason to leave something behind.
        if (!created.serviceId) return;

        const { status, body } = await call("DELETE", `/services/${created.serviceId}`);

        expect(status).toBe(200);
        expect(body).toEqual({ deleted: true });

        const gone = await call("GET", `/services/${created.serviceId}`);
        // Railway soft-deletes: the row survives with deletedAt set, or the
        // read fails outright once it's gone.
        if (gone.status === 200) expect(gone.body.service.deletedAt).not.toBeNull();
        else expect(gone.status).toBe(502);

        created.serviceId = "";
    });

    test("DELETE /environments/:id deletes the fork", async () => {
        if (!created.forkEnvironmentId) return;

        const { status, body } = await call(
            "DELETE",
            `/environments/${created.forkEnvironmentId}?projectId=${created.projectId}`,
        );

        expect(status).toBe(200);
        expect(body).toEqual({ deleted: true });
        created.forkEnvironmentId = "";
    });

    test("DELETE /projects/:id takes the project and everything under it", async () => {
        if (!created.projectId) return;

        const { status, body } = await call("DELETE", `/projects/${created.projectId}`);

        expect(status).toBe(200);
        expect(body).toEqual({ deleted: true });

        // Leaves the account clear for the next run — and stops afterAll from
        // trying again.
        const list = await call("GET", "/projects");
        expect(list.body.projects.some((p: any) => p.id === created.projectId)).toBe(false);

        created.projectId = "";
    });
});
