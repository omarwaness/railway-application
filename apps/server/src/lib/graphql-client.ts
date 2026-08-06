import { GraphQLClient } from "graphql-request";

import { env } from "./env";

/**
 * A Railway API client bound to the caller's token.
 *
 * Tokens are per-user (see `tokenMiddleware`), so this is a factory rather
 * than a shared instance — build one per request from `c.get('railwayToken')`:
 *
 *   const client = createRailwayClient(c.get('railwayToken'));
 *   const data = await client.request(PROJECTS_QUERY);
 */
export function createRailwayClient(token: string): GraphQLClient {
    if (!token) {
        throw new Error("Cannot create a Railway client without a token");
    }

    return new GraphQLClient(env.RAILWAY_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

/**
 * Unauthenticated client, for the handful of Railway queries that don't need
 * a token (introspection, public metadata). Anything user-scoped will come
 * back as "Not Authorized" — use `createRailwayClient` for those.
 */
export const railwayClient = new GraphQLClient(env.RAILWAY_ENDPOINT);
