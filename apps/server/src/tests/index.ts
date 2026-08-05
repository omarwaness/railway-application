import "dotenv/config";
import { randomBytes } from "node:crypto";

import postgres from "postgres";

import server from "../index";

/**
 * Tests own their encryption key. The checked-out .env may hold a missing or
 * invalid one, and we never want a test run to depend on (or write rows with)
 * the real key. Safe to set here because `getKey()` reads the env lazily, on
 * every call, rather than at import time.
 */
export const TEST_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;

/** Every user this suite creates is prefixed so cleanup can find them. */
export const TEST_EMAIL_PREFIX = "bun-test-";
export const TEST_PASSWORD = "testpassword123";

type ApiInit = RequestInit & { cookie?: string };

/** Calls the real Hono app in-process — no port binding, no dev-server clash. */
export function api(path: string, init: ApiInit = {}): Promise<Response> {
    const { cookie, ...rest } = init;
    const headers = new Headers(rest.headers);

    if (cookie) {
        headers.set("cookie", cookie);
    }
    if (rest.body && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
    }

    return Promise.resolve(
        server.fetch(new Request(`http://localhost${path}`, { ...rest, headers })),
    );
}

export type TestUser = { email: string; cookie: string };

/** Signs up a throwaway user and returns its session cookie. */
export async function signUpTestUser(): Promise<TestUser> {
    const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${randomBytes(4).toString("hex")}@example.com`;

    const res = await api("/api/auth/sign-up/email", {
        method: "POST",
        body: JSON.stringify({ email, password: TEST_PASSWORD, name: "Bun Test" }),
    });

    if (!res.ok) {
        throw new Error(`sign-up failed (${res.status}): ${await res.text()}`);
    }

    const cookie = res.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");

    if (!cookie) {
        throw new Error("sign-up returned no session cookie");
    }

    return { email, cookie };
}

/** Runs a query against the test database, closing the connection after. */
export async function withDb<T>(
    fn: (sql: postgres.Sql) => Promise<T>,
): Promise<T> {
    const sql = postgres(process.env.DATABASE_URL!);
    try {
        return await fn(sql);
    } finally {
        await sql.end();
    }
}

/** Removes every user this suite created; tokens/sessions cascade. */
export async function deleteTestUsers(): Promise<void> {
    await withDb(
        (sql) =>
            sql`delete from "user" where email like ${`${TEST_EMAIL_PREFIX}%`}`,
    );
}
