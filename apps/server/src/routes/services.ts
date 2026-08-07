import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";

import { createRailwayClient } from "../lib/graphql-client";
import {
    SERVICE_QUERY,
    SERVICE_CREATE_MUTATION,
    SERVICE_UPDATE_MUTATION,
    SERVICE_DELETE_MUTATION,
    SERVICE_CONNECT_MUTATION,
    SERVICE_DISCONNECT_MUTATION,
    SERVICE_INSTANCE_QUERY,
    SERVICE_INSTANCE_UPDATE_MUTATION,
    SERVICE_DETAIL_QUERY,
} from "../gql/service-queries";
import { railwayError } from "../lib/railway-error";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tokenMiddleware } from "../middlewares/token.middleware";
import type { HonoEnv } from "../types";

const app = new Hono<HonoEnv>();

app.use(authMiddleware);
app.use(tokenMiddleware);

// Shared field definitions.
const name = z.string().trim().min(1, "Name cannot be blank").max(255);
const icon = z.string().trim().min(1).max(1000);
const repo = z.string().trim().min(1);
const image = z.string().trim().min(1);
const branch = z.string().trim().min(1).max(255);

// `ServiceSourceInput` takes both `repo` and `image` and rejects neither, so
// the mutual exclusion has to happen here.
const sourceSchema = z
    .object({ repo: repo.optional(), image: image.optional() })
    .refine(
        (v) => Boolean(v.repo) !== Boolean(v.image),
        "Provide exactly one of repo or image",
    );

// Only `projectId` is required — omit `source` for an empty service, and
// Railway generates a name when one isn't given.
export const createServiceSchema = z.object({
    projectId: z.uuid("Invalid project id"),
    name: name.optional(),
    icon: icon.optional(),
    branch: branch.optional(),
    source: sourceSchema.optional(),
    // Railway's EnvironmentVariables scalar: a flat string→string map.
    variables: z.record(z.string(), z.string()).optional(),
    // Only narrows creation when the environment is a fork; otherwise the
    // service lands in every non-fork environment regardless.
    environmentId: z.uuid("Invalid environment id").optional(),
});

// Identity only — everything about how the service *runs* goes through
// PATCH /:id/instance.
export const updateServiceSchema = z
    .object({ name: name.optional(), icon: icon.optional() })
    .refine((v) => Object.keys(v).length > 0, "At least one field is required");

// Same repo/image exclusion as create; `branch` only means anything with a repo.
export const connectServiceSchema = z
    .object({ repo: repo.optional(), image: image.optional(), branch: branch.optional() })
    .refine(
        (v) => Boolean(v.repo) !== Boolean(v.image),
        "Provide exactly one of repo or image",
    )
    .refine((v) => !v.branch || Boolean(v.repo), "Branch requires a repo");

// Null clears a field back to "Railway decides"; the input accepts more than
// this, but these are the fields the instance query reads back.
export const updateInstanceSchema = z
    .object({
        startCommand: z.string().nullable().optional(),
        buildCommand: z.string().nullable().optional(),
        rootDirectory: z.string().nullable().optional(),
        healthcheckPath: z.string().nullable().optional(),
        region: z.string().trim().min(1).nullable().optional(),
        numReplicas: z.number().int().min(0).max(50).nullable().optional(),
        builder: z.enum(["HEROKU", "NIXPACKS", "PAKETO", "RAILPACK"]).optional(),
        restartPolicyType: z.enum(["ALWAYS", "NEVER", "ON_FAILURE"]).optional(),
        restartPolicyMaxRetries: z.number().int().min(0).max(10).optional(),
        sleepApplication: z.boolean().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, "At least one field is required");

const idParamSchema = z.object({ id: z.uuid("Invalid service id") });

const environmentQuerySchema = z.object({
    environmentId: z.uuid("Invalid environment id"),
});

const detailQuerySchema = z.object({
    projectId: z.uuid("Invalid project id"),
    environmentId: z.uuid("Invalid environment id"),
    unrendered: z.stringbool().optional(),
    deploymentLimit: z.coerce.number().int().min(1).max(100).optional(),
});

// A service's identity. Soft-deleted services come back with deletedAt set —
// same as PROJECTS_QUERY, the UI decides whether to show them.
app.get("/:id", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(SERVICE_QUERY, { id });
        return c.json({ service: data.service });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// How the service is configured in one environment.
app.get(
    "/:id/instance",
    sValidator("param", idParamSchema),
    sValidator("query", environmentQuerySchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { environmentId } = c.req.valid("query");

        try {
            const data = await client.request(SERVICE_INSTANCE_QUERY, {
                serviceId: id,
                environmentId,
            });
            return c.json({ instance: data.serviceInstance });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// The whole service detail panel — settings, domains, variables and history.
app.get(
    "/:id/detail",
    sValidator("param", idParamSchema),
    sValidator("query", detailQuerySchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { projectId, environmentId, unrendered, deploymentLimit } =
            c.req.valid("query");

        try {
            const data = await client.request(SERVICE_DETAIL_QUERY, {
                serviceId: id,
                projectId,
                environmentId,
                unrendered,
                deploymentLimit,
            });

            return c.json({
                instance: data.serviceInstance,
                variables: data.variables,
                // Flatten the connection — the client shouldn't care about edges.
                deployments: data.deployments.edges.map(({ node }) => node),
                pageInfo: data.deployments.pageInfo,
            });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Create a service — from a repo, an image, or nothing at all.
app.post("/", sValidator("json", createServiceSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const input = c.req.valid("json");

    try {
        const data = await client.request(SERVICE_CREATE_MUTATION, { input });
        return c.json({ service: data.serviceCreate }, 201);
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Rename a service or change its icon.
app.patch(
    "/:id",
    sValidator("param", idParamSchema),
    sValidator("json", updateServiceSchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const input = c.req.valid("json");

        try {
            const data = await client.request(SERVICE_UPDATE_MUTATION, { id, input });
            return c.json({ service: data.serviceUpdate });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Point a service at a repo or an image. `Service` has no source field, so the
// response can't echo the connection back — re-read the instance to confirm.
app.post(
    "/:id/connect",
    sValidator("param", idParamSchema),
    sValidator("json", connectServiceSchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const input = c.req.valid("json");

        try {
            const data = await client.request(SERVICE_CONNECT_MUTATION, { id, input });
            return c.json({ service: data.serviceConnect });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Detach the source in every environment at once — there's no narrower option.
// The service and its deployments survive.
app.post("/:id/disconnect", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(SERVICE_DISCONNECT_MUTATION, { id });
        return c.json({ service: data.serviceDisconnect });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Edit per-environment config. The mutation returns a bare Boolean, so the
// fresh instance is re-read to give the client something to confirm against.
app.patch(
    "/:id/instance",
    sValidator("param", idParamSchema),
    sValidator("query", environmentQuerySchema),
    sValidator("json", updateInstanceSchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { environmentId } = c.req.valid("query");
        const input = c.req.valid("json");

        try {
            const data = await client.request(SERVICE_INSTANCE_UPDATE_MUTATION, {
                serviceId: id,
                environmentId,
                input,
            });

            if (!data.serviceInstanceUpdate) {
                return c.json({ error: "Could not update service" }, 502);
            }

            const fresh = await client.request(SERVICE_INSTANCE_QUERY, {
                serviceId: id,
                environmentId,
            });

            return c.json({ instance: fresh.serviceInstance });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Delete a service everywhere. Irreversible — takes deployments, variables and
// domains with it.
app.delete("/:id", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(SERVICE_DELETE_MUTATION, { id });

        // serviceDelete returns a bare Boolean; false means Railway declined.
        if (!data.serviceDelete) {
            return c.json({ error: "Could not delete service" }, 502);
        }

        return c.json({ deleted: true });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

export default app;
