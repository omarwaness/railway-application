import { hc } from "hono/client"
import type { ClientResponse } from "hono/client"
import type { AppType } from "railway-controller-server"

// Inlined at build time by Next, so it has to be read as a whole expression —
// `process.env[key]` would come back undefined in the browser.
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL

if (!serverUrl) {
    throw new Error("NEXT_PUBLIC_SERVER_URL is not set")
}

/**
 * Typed client for the Hono API. Paths and payloads come from the server's
 * route definitions, so a route that changes shape breaks the call site here.
 *
 * `credentials: "include"` is what carries the better-auth session cookie
 * across origins; without it every route behind `authMiddleware` answers 401.
 */
export const rpc = hc<AppType>(serverUrl, {
    init: { credentials: "include" },
})

/** A non-2xx answer from the API. `status` is what retry logic keys off. */
export class ApiError extends Error {
    readonly status: number
    /** The parsed body, or null when the response wasn't JSON. */
    readonly body: unknown

    constructor(message: string, status: number, body: unknown) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.body = body
    }
}

type JsonResponse = ClientResponse<unknown, number, "json">

/**
 * The 2xx half of a route's response union. Hono types error returns with
 * their literal status, which resolves `ok` to `false` — so dropping those
 * leaves exactly the payloads a successful call can produce.
 */
type SuccessResponse<R extends JsonResponse> = Exclude<R, { ok: false }>

type SuccessData<R extends JsonResponse> = Awaited<
    ReturnType<SuccessResponse<R>["json"]>
>

function messageFor(body: unknown, status: number) {
    // Every route on the server reports failures as `{ error: string }`.
    if (
        body !== null &&
        typeof body === "object" &&
        "error" in body &&
        typeof body.error === "string"
    ) {
        return body.error
    }

    return `Request failed with status ${status}`
}

/**
 * Turns an RPC call into something TanStack Query can work with: throws on a
 * non-2xx instead of resolving, and narrows the result to just the success
 * payload so call sites don't have to discriminate on `error` themselves.
 *
 * `fetch` only rejects on network failure, so without this a 401 body would
 * land in `data` and `error` would stay undefined.
 *
 *     const data = await unwrap(rpc.token.$get())
 *     //    ^? { connected: false } | { connected: true; last4: string; ... }
 */
export async function unwrap<R extends JsonResponse>(
    call: Promise<R> | R
): Promise<SuccessData<R>> {
    const response = await call

    let body: unknown = null

    try {
        body = await (response as Response).json()
    } catch {
        // An empty or non-JSON body — nothing to report beyond the status.
    }

    if (!response.ok) {
        throw new ApiError(messageFor(body, response.status), response.status, body)
    }

    return body as SuccessData<R>
}

export type { InferRequestType, InferResponseType } from "hono/client"
