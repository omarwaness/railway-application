import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";

import { createRailwayClient } from "../lib/graphql-client";
import {
    DOMAINS_QUERY,
    CUSTOM_DOMAIN_AVAILABLE_QUERY,
    CUSTOM_DOMAIN_QUERY,
    SERVICE_DOMAIN_CREATE_MUTATION,
    SERVICE_DOMAIN_DELETE_MUTATION,
    CUSTOM_DOMAIN_CREATE_MUTATION,
    CUSTOM_DOMAIN_UPDATE_MUTATION,
    CUSTOM_DOMAIN_DELETE_MUTATION,
} from "../gql/domain-queries";
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
const domain = z.string().trim().toLowerCase().min(1, "Domain is required").max(253);

// The container port traffic is forwarded to. Omit it and Railway infers one.
const targetPort = z.number().int().min(1).max(65535);

const scopeSchema = z.object({ projectId, environmentId, serviceId });

const idParamSchema = z.object({ id: z.uuid("Invalid domain id") });

export const createServiceDomainSchema = z.object({
    serviceId,
    environmentId,
    targetPort: targetPort.optional(),
});

export const createCustomDomainSchema = z.object({
    projectId,
    environmentId,
    serviceId,
    domain,
    targetPort: targetPort.optional(),
});

// `targetPort` is the only updatable field, and null is meaningful — it clears
// the override and returns the domain to inferred routing.
export const updateCustomDomainSchema = z.object({
    projectId,
    environmentId,
    targetPort: targetPort.nullable(),
});

const routes = app
    // Every domain pointing at a service in one environment. This is where a
    // service's public URL lives — nothing on Service or ServiceInstance has it.
    .get("/", sValidator("query", scopeSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { projectId, environmentId, serviceId } = c.req.valid("query");

        try {
            const data = await client.request(DOMAINS_QUERY, {
                projectId,
                environmentId,
                serviceId,
            });

            // AllDomains is a plain object with two lists, not a connection.
            return c.json({
                serviceDomains: data.domains.serviceDomains,
                customDomains: data.domains.customDomains,
            });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    })

    // Whether a custom domain can be attached. `message` is populated either way,
    // so show it whatever `available` says.
    .get("/available", sValidator("query", z.object({ domain })), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { domain } = c.req.valid("query");

        try {
            const data = await client.request(CUSTOM_DOMAIN_AVAILABLE_QUERY, { domain });
            return c.json(data.customDomainAvailable);
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    })

    // One custom domain's DNS and certificate state — the poll target while a user
    // works through setup.
    .get(
        "/custom/:id",
        sValidator("param", idParamSchema),
        sValidator("query", z.object({ projectId })),
        async (c) => {
            const client = createRailwayClient(c.get("railwayToken"));
            const { id } = c.req.valid("param");
            const { projectId } = c.req.valid("query");

            try {
                const data = await client.request(CUSTOM_DOMAIN_QUERY, { id, projectId });
                return c.json({ customDomain: data.customDomain });
            } catch (err) {
                const { message, status } = railwayError(err);
                return c.json({ error: message }, status);
            }
        },
    )

    // Generate a Railway domain. The name is assigned upstream — there's no way to
    // request one. Comes back CREATING, not ACTIVE.
    .post("/service", sValidator("json", createServiceDomainSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const input = c.req.valid("json");

        try {
            const data = await client.request(SERVICE_DOMAIN_CREATE_MUTATION, { input });
            return c.json({ serviceDomain: data.serviceDomainCreate }, 201);
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    })

    // Remove a Railway-provided domain.
    .delete("/service/:id", sValidator("param", idParamSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");

        try {
            const data = await client.request(SERVICE_DOMAIN_DELETE_MUTATION, { id });

            if (!data.serviceDomainDelete) {
                return c.json({ error: "Could not delete domain" }, 502);
            }

            return c.json({ deleted: true });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    })

    // Attach a custom domain. It does not work when this returns — the user has to
    // add both the routing record from `status.dnsRecords` and a TXT record built
    // from `status.verificationToken`, which is a separate field. Both come back in
    // the response so setup instructions can be rendered from it alone.
    .post("/custom", sValidator("json", createCustomDomainSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const input = c.req.valid("json");

        try {
            const data = await client.request(CUSTOM_DOMAIN_CREATE_MUTATION, { input });
            return c.json({ customDomain: data.customDomainCreate }, 201);
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    })

    // Change which container port a custom domain forwards to. The mutation returns
    // a bare Boolean, so the domain is re-read to confirm.
    .patch(
        "/custom/:id",
        sValidator("param", idParamSchema),
        sValidator("json", updateCustomDomainSchema),
        async (c) => {
            const client = createRailwayClient(c.get("railwayToken"));
            const { id } = c.req.valid("param");
            const { projectId, environmentId, targetPort } = c.req.valid("json");

            try {
                const data = await client.request(CUSTOM_DOMAIN_UPDATE_MUTATION, {
                    id,
                    environmentId,
                    targetPort,
                });

                if (!data.customDomainUpdate) {
                    return c.json({ error: "Could not update domain" }, 502);
                }

                const fresh = await client.request(CUSTOM_DOMAIN_QUERY, { id, projectId });
                return c.json({ customDomain: fresh.customDomain });
            } catch (err) {
                const { message, status } = railwayError(err);
                return c.json({ error: message }, status);
            }
        },
    )

    // Detach a custom domain. Only removes it from Railway — the user's DNS records
    // still point here until they clean them up.
    .delete("/custom/:id", sValidator("param", idParamSchema), async (c) => {
        const client = createRailwayClient(c.get("railwayToken"));
        const { id } = c.req.valid("param");

        try {
            const data = await client.request(CUSTOM_DOMAIN_DELETE_MUTATION, { id });

            if (!data.customDomainDelete) {
                return c.json({ error: "Could not delete domain" }, 502);
            }

            return c.json({ deleted: true });
        } catch (err) {
            const { message, status } = railwayError(err);
            return c.json({ error: message }, status);
        }
    });

export default routes;
