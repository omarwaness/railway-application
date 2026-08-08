import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";

import { createRailwayClient } from "../lib/graphql-client";
import {
    VARIABLES_QUERY,
    VARIABLES_FOR_DEPLOYMENT_QUERY,
    VARIABLE_UPSERT_MUTATION,
    VARIABLE_COLLECTION_UPSERT_MUTATION,
    VARIABLE_DELETE_MUTATION,
} from "../gql/variable-queries";
import { railwayError } from "../lib/railway-error";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tokenMiddleware } from "../middlewares/token.middleware";
import type { HonoEnv } from "../types";

const app = new Hono<HonoEnv>()
    .use(authMiddleware)
    .use(tokenMiddleware);

const projectId = z.uuid("Invalid project id");
const environmentId = z.uuid("Invalid environment id");
const serviceId = z.uuid("Invalid service id");
const name = z.string().trim().min(1, "Name is required").max(256);
// Values may hold references in `${{ServiceName.VARIABLE_NAME}}` form; they're
// stored literally and resolved at deploy time.
const value = z.string().max(65536);

/**
 * Upstream, omitting `serviceId` silently switches from a service's own
 * variables to the environment's shared ones — same field, different scope.
 * `scope` makes that a choice rather than an accident: an undefined id can no
 * longer widen the call by mistake.
 */
const scopeShape = {
    projectId,
    environmentId,
    scope: z.enum(["service", "shared"]),
    serviceId: serviceId.optional(),
};

const scopeRefine = [
    (v: { scope: string; serviceId?: string }) =>
        (v.scope === "service") === Boolean(v.serviceId),
    "serviceId is required for scope=service and must be omitted for scope=shared",
] as const;

// `unrendered: true` returns references verbatim instead of resolving them —
// the right choice for an editor, since saving a rendered value back would bake
// the reference into a literal.
export const listVariablesSchema = z
    .object({ ...scopeShape, unrendered: z.stringbool().optional() })
    .refine(...scopeRefine);

export const upsertVariableSchema = z
    .object({
        ...scopeShape,
        name,
        value,
        // Without this every write redeploys the affected services — so a form
        // saving five variables one at a time causes five deploys.
        skipDeploys: z.boolean().optional(),
    })
    .refine(...scopeRefine);

export const upsertVariablesSchema = z
    .object({
        ...scopeShape,
        variables: z.record(name, value),
        // The dangerous one: true deletes every variable *not* in the payload,
        // making this an overwrite rather than a merge. Only safe when the
        // payload came from a complete read of the same scope.
        replace: z.boolean().optional(),
        skipDeploys: z.boolean().optional(),
    })
    .refine(...scopeRefine);

export const deleteVariableSchema = z
    .object({ ...scopeShape, name })
    .refine(...scopeRefine);

const routes = app
    // Variables set at one scope. Shared variables and a service's own are the same
    // field upstream — see `scope`.
    .get("/", sValidator("query", listVariablesSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { projectId, environmentId, serviceId, unrendered } = c.req.valid("query");

        try {
            // A flat name→value map, not a list — there are no ids to delete by.
            const data = await client.request(VARIABLES_QUERY, {
                projectId,
                environmentId,
                serviceId,
                unrendered,
            });

            return c.json({ variables: data.variables });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    })

    // Every variable a deployment would actually see: service variables merged with
    // shared ones, references expanded, plus whatever Railway injects. No shared
    // form here — `serviceId` is required.
    .get(
        "/deployment",
        sValidator("query", z.object({ projectId, environmentId, serviceId })),
        async (c) => {
            const client = createRailwayClient(c.get("railwayToken"));
            const { projectId, environmentId, serviceId } = c.req.valid("query");

            try {
                const data = await client.request(VARIABLES_FOR_DEPLOYMENT_QUERY, {
                    projectId,
                    environmentId,
                    serviceId,
                });

                return c.json({ variables: data.variablesForServiceDeployment });
            } catch (err) {
                const { message, status } = railwayError(err);
                return c.json({ error: message }, status);
            }
        },
    )

    // Create or overwrite one variable. There is no separate create — upsert keyed
    // by name is the only single write.
    .put("/", sValidator("json", upsertVariableSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { scope: _scope, ...input } = c.req.valid("json");

        try {
            const data = await client.request(VARIABLE_UPSERT_MUTATION, { input });

            if (!data.variableUpsert) {
                return c.json({ error: "Could not save variable" }, 502);
            }

            return c.json({ saved: true });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    })

    // Write many at once — a bulk editor, a .env import, or copying between
    // environments. One deploy for the whole batch instead of one each.
    .put("/bulk", sValidator("json", upsertVariablesSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { scope: _scope, ...input } = c.req.valid("json");

        try {
            const data = await client.request(VARIABLE_COLLECTION_UPSERT_MUTATION, { input });

            if (!data.variableCollectionUpsert) {
                return c.json({ error: "Could not save variables" }, 502);
            }

            return c.json({ saved: true });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    })

    // Delete one variable by name. Note there's no skipDeploys on this one, so a
    // delete always triggers a deploy — clearing several is cheaper through
    // PUT /bulk with `replace: true`.
    .delete("/", sValidator("query", deleteVariableSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { scope: _scope, ...input } = c.req.valid("query");

        try {
            const data = await client.request(VARIABLE_DELETE_MUTATION, { input });

            if (!data.variableDelete) {
                return c.json({ error: "Could not delete variable" }, 502);
            }

            return c.json({ deleted: true });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    });

export default routes;
