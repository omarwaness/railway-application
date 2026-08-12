import { readSession } from "./config";

/** Where the Hono API listens by default — `apps/server` hardcodes port 4000. */
const DEFAULT_SERVER_URL = "http://localhost:4000";

/** The API's base URL, overridable for anything that isn't a local server. */
export function serverUrl(): string {
    const url = process.env.RW_SERVER_URL ?? DEFAULT_SERVER_URL;
    return url.replace(/\/+$/, "");
}

/** A non-2xx answer from the API. `status` is what call sites branch on. */
export class ApiError extends Error {
    readonly status: number;
    readonly body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

/** The server was unreachable — a wrong URL or nothing listening. */
export class NetworkError extends Error {
    constructor(url: string, cause: unknown) {
        super(
            `Could not reach the API at ${url}.\n` +
                "Start the server (`bun run dev` in apps/server), or point RW_SERVER_URL at it.",
        );
        this.name = "NetworkError";
        this.cause = cause;
    }
}

/**
 * Pulls the message out of a failed response. Routes report failures as
 * `{ error: string }`, except the validator, which never reaches the route and
 * answers with the schema's own issues instead.
 */
function messageFor(body: unknown, status: number): string {
    if (body === null || typeof body !== "object" || !("error" in body)) {
        return `Request failed with status ${status}`;
    }

    const { error } = body as { error: unknown };

    if (typeof error === "string") return error;

    if (Array.isArray(error)) {
        const [issue] = error;

        if (
            issue !== null &&
            typeof issue === "object" &&
            "message" in issue &&
            typeof issue.message === "string"
        ) {
            return issue.message;
        }
    }

    return `Request failed with status ${status}`;
}

interface RequestOptions {
    method?: string;
    /** Serialized as JSON; omitted entirely for GETs. */
    body?: unknown;
    /** Skips the session cookie — only sign-in, which is establishing one. */
    anonymous?: boolean;
}

/**
 * One call against the API, left unread so sign-in can get at `Set-Cookie`.
 * The session cookie is attached here rather than at each call site: every
 * route on the server sits behind `authMiddleware`, so there's no such thing
 * as an unauthenticated request worth making.
 */
export async function request(
    path: string,
    { method = "GET", body, anonymous = false }: RequestOptions = {},
): Promise<Response> {
    const url = `${serverUrl()}${path}`;

    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";

    if (!anonymous) {
        const session = await readSession();
        if (session) headers["Cookie"] = session;
    }

    try {
        return await fetch(url, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (error) {
        throw new NetworkError(serverUrl(), error);
    }
}

/** The response body, or null when there wasn't a JSON one. */
export async function readBody(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        // An empty or non-JSON body — the status is all there is to report.
        return null;
    }
}

/** A call against the API that returns the parsed body and throws on non-2xx. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await request(path, options);
    const payload = await readBody(response);

    if (!response.ok) {
        // 401 is the one every command can hit before it does anything wrong,
        // so it says what to do rather than repeating the server's word.
        if (response.status === 401) {
            throw new ApiError("Not signed in. Run `rw login` first.", 401, payload);
        }

        throw new ApiError(messageFor(payload, response.status), response.status, payload);
    }

    return payload as T;
}

export { messageFor };
