import { ClientError } from "graphql-request";

/**
 * Railway answers with 200 + an `errors` array, which graphql-request throws
 * as ClientError. Anything else is a real failure and should bubble up.
 */
export function railwayError(err: unknown) {
    if (!(err instanceof ClientError)) throw err;

    const message = err.response.errors?.[0]?.message ?? "Railway request failed";
    const status = message === "Not Authorized" ? 403 : 502;

    return { message, status } as const;
}
