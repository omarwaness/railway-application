import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";

import { createRailwayClient } from "../lib/graphql-client";
import {
    DEPLOYMENTS_QUERY,
    DEPLOYMENT_QUERY,
    BUILD_LOGS_QUERY,
    DEPLOYMENT_LOGS_QUERY,
    HTTP_LOGS_QUERY,
    SERVICE_INSTANCE_DEPLOY_MUTATION,
    SERVICE_INSTANCE_REDEPLOY_MUTATION,
    ENVIRONMENT_TRIGGERS_DEPLOY_MUTATION,
    DEPLOYMENT_REDEPLOY_MUTATION,
    DEPLOYMENT_RESTART_MUTATION,
    DEPLOYMENT_ROLLBACK_MUTATION,
    DEPLOYMENT_STOP_MUTATION,
    DEPLOYMENT_CANCEL_MUTATION,
    DEPLOYMENT_REMOVE_MUTATION,
} from "../gql/deployment-queries";
import { railwayError } from "../lib/railway-error";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tokenMiddleware } from "../middlewares/token.middleware";
import type { HonoEnv } from "../types";

const app = new Hono<HonoEnv>();

app.use(authMiddleware);
app.use(tokenMiddleware);

const serviceId = z.uuid("Invalid service id");
const environmentId = z.uuid("Invalid environment id");
const projectId = z.uuid("Invalid project id");

const deploymentStatus = z.enum([
    "BUILDING",
    "CRASHED",
    "DEPLOYING",
    "FAILED",
    "INITIALIZING",
    "NEEDS_APPROVAL",
    "QUEUED",
    "REMOVED",
    "REMOVING",
    "SKIPPED",
    "SLEEPING",
    "SUCCESS",
    "WAITING",
]);

// Comma-separated on the wire: `?status=SUCCESS,FAILED`.
const statusList = z
    .string()
    .transform((v) => v.split(","))
    .pipe(z.array(deploymentStatus).min(1));

// `DeploymentListInput` is all-optional and widens as fields drop off, so
// `projectId` is required here to stop a bare call listing everything the token
// can see.
export const listDeploymentsSchema = z.object({
    projectId,
    environmentId: environmentId.optional(),
    serviceId: serviceId.optional(),
    status: statusList.optional(),
    includeDeleted: z.stringbool().optional(),
    first: z.coerce.number().int().min(1).max(100).optional(),
    after: z.string().optional(),
});

// These fields return a plain list with no pagination, so `limit` is the only
// thing standing between a noisy build and a huge response.
export const logsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(5000).optional(),
    filter: z.string().optional(),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
});

// httpLogs pages by date cursor rather than a start/end window, so it takes a
// different shape from the other two.
export const httpLogsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(1000).optional(),
    filter: z.string().optional(),
});

// Omit `commitSha` to deploy the commit the service already points at; pass one
// to ship a specific commit. Railway rejects an unknown SHA without creating a
// deployment.
export const deploySchema = z.object({
    serviceId,
    environmentId,
    commitSha: z.string().trim().min(7).max(40).optional(),
});

const serviceEnvSchema = z.object({ serviceId, environmentId });

const triggersDeploySchema = z.object({ projectId, serviceId, environmentId });

const idParamSchema = z.object({ id: z.uuid("Invalid deployment id") });

// Deployment history. Drop `serviceId` for the whole environment, drop
// `environmentId` too for the whole project.
app.get("/", sValidator("query", listDeploymentsSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { projectId, environmentId, serviceId, status, includeDeleted, first, after } =
        c.req.valid("query");

    try {
        const data = await client.request(DEPLOYMENTS_QUERY, {
            input: {
                projectId,
                environmentId,
                serviceId,
                includeDeleted,
                status: status && { in: status },
            },
            first,
            after,
        });

        return c.json({
            deployments: data.deployments.edges.map(({ node }) => node),
            pageInfo: data.deployments.pageInfo,
        });
    } catch (err) {
        const { message, status: code } = railwayError(err);
        return c.json({ error: message }, code);
    }
});

// One deployment — the poll target after a deploy, and the only way to find out
// whether it actually succeeded.
app.get("/:id", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(DEPLOYMENT_QUERY, { id });
        return c.json({ deployment: data.deployment });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Build-time logs. A failed build has output here and nothing in /logs.
app.get(
    "/:id/build-logs",
    sValidator("param", idParamSchema),
    sValidator("query", logsQuerySchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { limit, filter, startDate, endDate } = c.req.valid("query");

        try {
            const data = await client.request(BUILD_LOGS_QUERY, {
                deploymentId: id,
                limit,
                filter,
                startDate,
                endDate,
            });
            return c.json({ logs: data.buildLogs });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Runtime logs — stdout/stderr from the running container.
app.get(
    "/:id/logs",
    sValidator("param", idParamSchema),
    sValidator("query", logsQuerySchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { limit, filter, startDate, endDate } = c.req.valid("query");

        try {
            const data = await client.request(DEPLOYMENT_LOGS_QUERY, {
                deploymentId: id,
                limit,
                filter,
                startDate,
                endDate,
            });
            return c.json({ logs: data.deploymentLogs });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// HTTP access logs from Railway's edge — only for deployments serving traffic
// through a domain.
app.get(
    "/:id/http-logs",
    sValidator("param", idParamSchema),
    sValidator("query", httpLogsQuerySchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { limit, filter } = c.req.valid("query");

        try {
            const data = await client.request(HTTP_LOGS_QUERY, {
                deploymentId: id,
                limit,
                filter,
            });
            return c.json({ logs: data.httpLogs });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Deploy a service. Returns the new deployment's id — poll GET /:id for status,
// since nothing here reports whether the build succeeded.
app.post("/", sValidator("json", deploySchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { serviceId, environmentId, commitSha } = c.req.valid("json");

    try {
        const data = await client.request(SERVICE_INSTANCE_DEPLOY_MUTATION, {
            serviceId,
            environmentId,
            commitSha,
        });
        return c.json({ deploymentId: data.serviceInstanceDeployV2 }, 201);
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Re-run a service's latest deployment on the commit it already has. Never
// picks up new commits — POST / with a commitSha does that. Returns no id, so
// re-read the service instance for status.
app.post("/redeploy", sValidator("json", serviceEnvSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { serviceId, environmentId } = c.req.valid("json");

    try {
        const data = await client.request(SERVICE_INSTANCE_REDEPLOY_MUTATION, {
            serviceId,
            environmentId,
        });

        if (!data.serviceInstanceRedeploy) {
            return c.json({ error: "Could not redeploy service" }, 502);
        }

        return c.json({ redeployed: true });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Deploy following the environment's configured triggers rather than a specific
// commit. Returns no deployment id — prefer POST / when you need one.
app.post("/triggers", sValidator("json", triggersDeploySchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const input = c.req.valid("json");

    try {
        const data = await client.request(ENVIRONMENT_TRIGGERS_DEPLOY_MUTATION, { input });

        if (!data.environmentTriggersDeploy) {
            return c.json({ error: "Could not trigger deploy" }, 502);
        }

        return c.json({ deployed: true });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Redeploy an existing deployment. Gate the button on `canRedeploy` from
// GET /:id. Returns the new record, unlike POST /redeploy.
app.post("/:id/redeploy", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(DEPLOYMENT_REDEPLOY_MUTATION, { id });
        return c.json({ deployment: data.deploymentRedeploy }, 201);
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Restart without rebuilding — same image, same commit, fresh container.
app.post("/:id/restart", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(DEPLOYMENT_RESTART_MUTATION, { id });

        if (!data.deploymentRestart) {
            return c.json({ error: "Could not restart deployment" }, 502);
        }

        return c.json({ restarted: true });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Roll back to this deployment. Only valid where `canRollback` is true, and it
// returns no record — re-read the service instance's latestDeployment.
app.post("/:id/rollback", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(DEPLOYMENT_ROLLBACK_MUTATION, { id });

        if (!data.deploymentRollback) {
            return c.json({ error: "Could not roll back deployment" }, 502);
        }

        return c.json({ rolledBack: true });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Stop a running deployment. The record stays in the history.
app.post("/:id/stop", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(DEPLOYMENT_STOP_MUTATION, { id });

        if (!data.deploymentStop) {
            return c.json({ error: "Could not stop deployment" }, 502);
        }

        return c.json({ stopped: true });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Cancel a deployment that hasn't settled yet. A false on one that already
// finished is the expected answer, not a failure — hence 409 rather than 502.
app.post("/:id/cancel", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(DEPLOYMENT_CANCEL_MUTATION, { id });

        if (!data.deploymentCancel) {
            return c.json({ error: "Deployment is no longer cancellable" }, 409);
        }

        return c.json({ cancelled: true });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Take a deployment out of the history. Distinct from /stop — removed
// deployments still show up in the list with status REMOVED unless filtered.
app.delete("/:id", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(DEPLOYMENT_REMOVE_MUTATION, { id });

        if (!data.deploymentRemove) {
            return c.json({ error: "Could not remove deployment" }, 502);
        }

        return c.json({ removed: true });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

export default app;
