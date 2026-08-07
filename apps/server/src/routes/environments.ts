import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";

import { createRailwayClient } from "../lib/graphql-client";
import { useFragment } from "../gql/generated";
import { SERVICE_ROW_FRAGMENT } from "../gql/service-queries";
import { PROJECT_OVERVIEW_QUERY } from "../gql/project-queries";
import {
    ENVIRONMENTS_QUERY,
    ENVIRONMENT_QUERY,
    ENVIRONMENT_LOGS_QUERY,
    ENVIRONMENT_STAGED_CHANGES_QUERY,
    ENVIRONMENT_CREATE_MUTATION,
    ENVIRONMENT_RENAME_MUTATION,
    ENVIRONMENT_DELETE_MUTATION,
    ENVIRONMENT_PATCH_COMMIT_STAGED_MUTATION,
} from "../gql/environment-queries";
import { railwayError } from "../lib/railway-error";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tokenMiddleware } from "../middlewares/token.middleware";
import type { HonoEnv } from "../types";

const app = new Hono<HonoEnv>();

app.use(authMiddleware);
app.use(tokenMiddleware);

const name = z.string().trim().min(1, "Name cannot be blank").max(255);
const projectId = z.uuid("Invalid project id");

// `isEphemeral` is tri-state by omission: leave it out for every environment,
// false for the permanent ones, true for PR/preview environments only.
export const listEnvironmentsSchema = z.object({
    projectId,
    isEphemeral: z.stringbool().optional(),
    first: z.coerce.number().int().min(1).max(100).optional(),
    after: z.string().optional(),
});

// `sourceEnvironmentId` is what turns this into a fork — without it you get an
// empty environment rather than a copy.
export const createEnvironmentSchema = z.object({
    name,
    projectId,
    sourceEnvironmentId: z.uuid("Invalid environment id").optional(),
    ephemeral: z.boolean().optional(),
    skipInitialDeploys: z.boolean().optional(),
    stageInitialChanges: z.boolean().optional(),
    // With this true the mutation returns before the services exist, so the
    // client has to poll. Left to the caller rather than defaulted here.
    applyChangesInBackground: z.boolean().optional(),
});

// Renaming is the only mutable field on an environment.
export const renameEnvironmentSchema = z.object({ name });

// Commits whatever was staged in the Railway dashboard. Nothing this API writes
// ends up staged — those changes apply immediately.
export const commitStagedSchema = z.object({
    commitMessage: z.string().max(1000).optional(),
    // Commits the config without rolling it out, leaving running services out
    // of sync until something else triggers a deploy.
    skipDeploys: z.boolean().optional(),
});

const idParamSchema = z.object({ id: z.uuid("Invalid environment id") });

// List environments in a project — the environment switcher.
app.get("/", sValidator("query", listEnvironmentsSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { projectId, isEphemeral, first, after } = c.req.valid("query");

    try {
        const data = await client.request(ENVIRONMENTS_QUERY, {
            projectId,
            isEphemeral,
            first,
            after,
        });

        return c.json({
            // Soft-deleted environments come back with deletedAt intact; the
            // UI decides what to show.
            environments: data.environments.edges.map(({ node }) => node),
            pageInfo: data.environments.pageInfo,
        });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// One environment plus the services running in it — what the project page
// re-fetches after an environment switch.
app.get(
    "/:id",
    sValidator("param", idParamSchema),
    sValidator("query", z.object({ projectId: projectId.optional() })),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { projectId } = c.req.valid("query");

        try {
            const data = await client.request(ENVIRONMENT_QUERY, { id, projectId });
            const { serviceInstances, ...environment } = data.environment;

            return c.json({
                environment,
                // Same ...ServiceRow shape the project overview returns, so the
                // list renders from one shape either way.
                services: serviceInstances.edges.map(({ node }) =>
                    useFragment(SERVICE_ROW_FRAGMENT, node),
                ),
            });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Logs from every service in the environment, merged. Each line carries the
// service and deployment it came from in `tags`.
app.get(
    "/:id/logs",
    sValidator("param", idParamSchema),
    sValidator("query", z.object({ filter: z.string().optional() })),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { filter } = c.req.valid("query");

        try {
            const data = await client.request(ENVIRONMENT_LOGS_QUERY, {
                environmentId: id,
                filter,
            });
            return c.json({ logs: data.environmentLogs });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Changes staged in the Railway dashboard but not yet committed — invisible to
// every other query here, so a service can read one way and look another way
// in the dashboard.
app.get("/:id/staged-changes", sValidator("param", idParamSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const { id } = c.req.valid("param");

    try {
        const data = await client.request(ENVIRONMENT_STAGED_CHANGES_QUERY, {
            environmentId: id,
        });
        return c.json({ stagedChanges: data.environmentStagedChanges });
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Create an environment, empty or forked from an existing one.
app.post("/", sValidator("json", createEnvironmentSchema), async (c) => {
    const client = createRailwayClient(c.get("railwayToken"));
    const input = c.req.valid("json");

    try {
        const data = await client.request(ENVIRONMENT_CREATE_MUTATION, { input });
        return c.json({ environment: data.environmentCreate }, 201);
    } catch (err) {
        const { message, status } = railwayError(err);
        return c.json({ error: message }, status);
    }
});

// Rename an environment. Variable references are by service name, so this
// doesn't break them.
app.patch(
    "/:id",
    sValidator("param", idParamSchema),
    sValidator("json", renameEnvironmentSchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const input = c.req.valid("json");

        try {
            const data = await client.request(ENVIRONMENT_RENAME_MUTATION, { id, input });
            return c.json({ environment: data.environmentRename });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Commit the dashboard's staged changes, deploying the affected services.
// Returns the resulting patch id.
app.post(
    "/:id/commit",
    sValidator("param", idParamSchema),
    sValidator("json", commitStagedSchema),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { commitMessage, skipDeploys } = c.req.valid("json");

        try {
            const data = await client.request(ENVIRONMENT_PATCH_COMMIT_STAGED_MUTATION, {
                environmentId: id,
                commitMessage,
                skipDeploys,
            });
            return c.json({ patchId: data.environmentPatchCommitStaged });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

// Delete an environment and everything in it. Irreversible.
//
// `projectId` is required because nothing in the schema stops you deleting the
// environment a project can't do without — that check has to happen here.
app.delete(
    "/:id",
    sValidator("param", idParamSchema),
    sValidator("query", z.object({ projectId })),
    async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");
        const { projectId } = c.req.valid("query");

        try {
            const { project } = await client.request(PROJECT_OVERVIEW_QUERY, {
                id: projectId,
            });

            if (project.primaryEnvironmentId === id) {
                return c.json({ error: "Cannot delete the primary environment" }, 400);
            }

            // A project can have no primary set at all, in which case the check
            // above never fires and nothing stops the last environment going.
            // The query defaults to isEphemeral: false, so preview environments
            // don't count towards keeping one alive.
            const permanent = project.environments.edges;

            if (permanent.length <= 1 && permanent.some(({ node }) => node.id === id)) {
                return c.json({ error: "Cannot delete the project's only environment" }, 400);
            }

            const data = await client.request(ENVIRONMENT_DELETE_MUTATION, { id });

            // environmentDelete returns a bare Boolean; false means Railway declined.
            if (!data.environmentDelete) {
                return c.json({ error: "Could not delete environment" }, 502);
            }

            return c.json({ deleted: true });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    },
);

export default app;
