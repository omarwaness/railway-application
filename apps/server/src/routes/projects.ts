import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { ClientError } from "graphql-request";
import { z } from "zod";

import { createRailwayClient } from "../lib/graphql-client";
import {
    PROJECTS_QUERY,
    PROJECT_CREATE_MUTATION,
    PROJECT_UPDATE_MUTATION,
    PROJECT_DELETE_MUTATION,
} from "../gql/project-queries";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tokenMiddleware } from "../middlewares/token.middleware";
import type { HonoEnv } from "../types";

const app = new Hono<HonoEnv>();

app.use(authMiddleware);
app.use(tokenMiddleware);

// Shared field definitions — every field is optional on both create and update.
const name = z.string().trim().min(1, "Name cannot be blank").max(255);
const description = z.string().max(1000);
const isPublic = z.boolean();
const prDeploys = z.boolean();

export const listProjectsSchema = z.object({
    workspaceId: z.string().trim().min(1).optional(),
    first: z.coerce.number().int().min(1).max(100).optional(),
    after: z.string().optional(),
    orderBy: z.enum(["CREATED_AT_DESC", "NAME_ASC", "UPDATED_AT_DESC"]).optional(),
});

// Every field is optional upstream — `{}` creates a project with a name that
// Railway generates. Blank/oversized values are still rejected when present.
export const createProjectSchema = z.object({
    name: name.optional(),
    description: description.optional(),
    workspaceId: z.string().trim().min(1).optional(),
    isPublic: isPublic.optional(),
    prDeploys: prDeploys.optional(),
});

// Railway ignores nulls on update, so `description: ""` is how you clear it.
export const updateProjectSchema = z
    .object({
        name: name.optional(),
        description: description.optional(),
        isPublic: isPublic.optional(),
        prDeploys: prDeploys.optional(),
    })
    .refine((v) => Object.keys(v).length > 0, "At least one field is required");

const idParamSchema = z.object({ id: z.uuid("Invalid project id") });

/**
 * Railway answers with 200 + an `errors` array, which graphql-request throws
 * as ClientError. Anything else is a real failure and should bubble up.
 */
function railwayError(err: unknown) {
    if (!(err instanceof ClientError)) throw err;

    const message = err.response.errors?.[0]?.message ?? "Railway request failed";
    const status = message === "Not Authorized" ? 403 : 502;

    return { message, status } as const;
}

// List the caller's projects, newest activity first.
app.get("/", sValidator("query", listProjectsSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { workspaceId, first, after, orderBy } = c.req.valid("query");

    try {
        const data = await client.request(PROJECTS_QUERY, {
            workspaceId,
            first,
            after,
            orderBy,
        });

        return c.json({
            // Flatten the connection — the client shouldn't care about edges.
            // Soft-deleted projects and services are both passed through with
            // their deletedAt intact; deciding what to show is the UI's call.
            projects: data.projects.edges.map(({ node }) => ({
                ...node,
                services: node.services.edges.map(({ node: service }) => service),
            })),
            pageInfo: data.projects.pageInfo,
            // Batched into the same query so the dashboard paints from one
            // request — the workspace switcher needs these on first load.
            workspaces: data.apiToken.workspaces,
        });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Create a project.
app.post("/", sValidator("json", createProjectSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const input = c.req.valid("json");

    try {
        const data = await client.request(PROJECT_CREATE_MUTATION, { input });
        return c.json({ project: { ...data.projectCreate, services: [] } }, 201);
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Update a project. Only the fields present in the body are changed.
app.patch(
    "/:id",
    sValidator("param", idParamSchema),
    sValidator("json", updateProjectSchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const input = c.req.valid("json");

        try {
            const data = await client.request(PROJECT_UPDATE_MUTATION, { id, input });
            return c.json({ project: data.projectUpdate });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Delete a project. Irreversible — takes every service and volume with it.
app.delete("/:id", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(PROJECT_DELETE_MUTATION, { id });

        // projectDelete returns a bare Boolean; false means Railway declined.
        if (!data.projectDelete) {
            return c.json({ error: "Could not delete project" }, 502);
        }

        return c.json({ deleted: true });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

export default app;
