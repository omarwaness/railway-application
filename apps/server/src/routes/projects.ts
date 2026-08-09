import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";

import { createRailwayClient } from "../lib/graphql-client";
import { railwayError } from "../lib/railway-error";
import {
    PROJECTS_QUERY,
    PROJECT_OVERVIEW_QUERY,
    PROJECT_CREATE_MUTATION,
    PROJECT_UPDATE_MUTATION,
    PROJECT_DELETE_MUTATION,
} from "../gql/project-queries";
import type { FragmentType } from "../gql/generated";
import { SERVICE_ROW_FRAGMENT, serviceRow } from "../gql/service-queries";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tokenMiddleware } from "../middlewares/token.middleware";
import type { HonoEnv } from "../types";

const app = new Hono<HonoEnv>()
    .use(authMiddleware)
    .use(tokenMiddleware);

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

// Railway requires both halves of a repo. Only the name identifies it, so the
// branch defaults rather than forcing every caller to say "main".
const repo = z.object({
    fullRepoName: z.string().trim().min(1).max(255),
    branch: z.string().trim().min(1).max(255).default("main"),
});

// Every field is optional upstream — `{}` creates a project with a name that
// Railway generates. Blank/oversized values are still rejected when present.
export const createProjectSchema = z.object({
    name: name.optional(),
    description: description.optional(),
    workspaceId: z.string().trim().min(1).optional(),
    isPublic: isPublic.optional(),
    prDeploys: prDeploys.optional(),
    repo: repo.optional(),
});

// `isEphemeral` defaults to false in the query itself, which keeps PR/preview
// environments out of the switcher; pass true for just those.
export const projectOverviewSchema = z.object({
    envFirst: z.coerce.number().int().min(1).max(100).optional(),
    isEphemeral: z.stringbool().optional(),
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

/** Flattens an environment's service instances into the shared ServiceRow shape. */
function withServices(env: {
    id: string;
    name: string;
    unmergedChangesCount: number | null;
    serviceInstances: {
        edges: Array<{ node: FragmentType<typeof SERVICE_ROW_FRAGMENT> }>;
    };
}) {
    return {
        id: env.id,
        name: env.name,
        unmergedChangesCount: env.unmergedChangesCount,
        services: env.serviceInstances.edges.map(({ node }) => serviceRow(node)),
    };
}

const routes = app
    // List the caller's projects, newest activity first.
    .get("/", sValidator("query", listProjectsSchema), async (c) => {
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
    })

    // The project page: header, environments for the switcher, and the services in
    // the base environment. Loads from a project id alone, which is what a direct
    // URL or a refresh has — switch to GET /environments/:id once the user picks a
    // different environment.
    .get(
        "/:id",
        sValidator("param", idParamSchema),
        sValidator("query", projectOverviewSchema),
        async (c) => {
            const client = createRailwayClient(c.get("railwayToken"));
            const { id } = c.req.valid("param");
            const { envFirst, isEphemeral } = c.req.valid("query");

            try {
                const data = await client.request(PROJECT_OVERVIEW_QUERY, {
                    id,
                    envFirst,
                    isEphemeral,
                });

                const { environments, ...project } = data.project;
                const envs = environments.edges.map(({ node }) => node);

                // The environment the page opens on. `primaryEnvironmentId` is the
                // right field for this — `baseEnvironmentId` is a PR-deploys
                // setting and is null on a normal project. Falling back to the
                // first environment covers a project that has neither set, which
                // otherwise leaves the page with no environment id at all.
                const primary =
                    envs.find((env) => env.id === project.primaryEnvironmentId) ?? envs[0];

                return c.json({
                    project,
                    // The service lists ride along only on the environment being
                    // shown; the rest of the switcher just needs names.
                    environments: envs.map(({ serviceInstances, ...env }) => env),
                    environmentsPageInfo: environments.pageInfo,
                    primaryEnvironment: primary ? withServices(primary) : null,
                });
            } catch (err) {
                const { message, status } = railwayError(err);
                return c.json({ error: message }, status);
            }
        },
    )

    // Create a project.
    .post("/", sValidator("json", createProjectSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const input = c.req.valid("json");

        try {
            const data = await client.request(PROJECT_CREATE_MUTATION, { input });
            return c.json({ project: { ...data.projectCreate, services: [] } }, 201);
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    })

    // Update a project. Only the fields present in the body are changed.
    .patch(
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
    )

    // Delete a project. Irreversible — takes every service and volume with it.
    .delete("/:id", sValidator("param", idParamSchema), async (c) => {
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

export default routes;
