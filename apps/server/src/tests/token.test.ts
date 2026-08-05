import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import {
    api,
    deleteTestUsers,
    signUpTestUser,
    withDb,
    type TestUser,
} from "./index";
import { decryptToken } from "../lib/crypto";
import { saveTokenSchema } from "../routes/token";

const TOKEN = "e7f2c9a1-4b6d-4e8f-9c1a-2d3b4f5a6ajd";
const OTHER_TOKEN = "11112222333344445555666677778xyz";

let user: TestUser;

beforeAll(async () => {
    await deleteTestUsers();
    user = await signUpTestUser();
});

afterAll(async () => {
    await deleteTestUsers();
});

/** Clears the token so each test starts from a known state. */
async function reset() {
    await api("/token", { method: "DELETE", cookie: user.cookie });
}

describe("auth", () => {
    test.each(["GET", "POST", "DELETE"])(
        "%s /token is 401 without a session",
        async (method) => {
            const res = await api("/token", {
                method,
                body: method === "POST" ? JSON.stringify({ token: TOKEN }) : undefined,
            });

            expect(res.status).toBe(401);
            expect(await res.json()).toEqual({ error: "Unauthorized" });
        },
    );

    test("is 401 with a garbage session cookie", async () => {
        const res = await api("/token", { cookie: "better-auth.session_token=nope" });

        expect(res.status).toBe(401);
    });
});

describe("GET /token", () => {
    test("reports not connected when no token is saved", async () => {
        await reset();

        const res = await api("/token", { cookie: user.cookie });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ connected: false });
    });

    test("returns last4 and timestamps once saved", async () => {
        await reset();
        await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: TOKEN }),
        });

        const res = await api("/token", { cookie: user.cookie });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.connected).toBe(true);
        expect(body.last4).toBe("6ajd");
        expect(Date.parse(body.createdAt)).not.toBeNaN();
        expect(Date.parse(body.updatedAt)).not.toBeNaN();
    });

    test("never leaks the token or its ciphertext", async () => {
        await reset();
        await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: TOKEN }),
        });

        const text = await (await api("/token", { cookie: user.cookie })).text();

        expect(text).not.toContain(TOKEN);
        expect(text).not.toContain("encryptedToken");
    });
});

describe("POST /token", () => {
    test("saves a token and returns only last4", async () => {
        await reset();

        const res = await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: TOKEN }),
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ connected: true, last4: "6ajd" });
    });

    test("stores the token encrypted, not in plaintext", async () => {
        await reset();
        await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: TOKEN }),
        });

        const [row] = await withDb(
            (sql) =>
                sql`select rt.encrypted_token, rt.last4 from railway_token rt
                    join "user" u on u.id = rt.user_id where u.email = ${user.email}`,
        );

        expect(row.encrypted_token).not.toContain(TOKEN);
        expect(row.encrypted_token.split(":")).toHaveLength(3);
        expect(decryptToken(row.encrypted_token)).toBe(TOKEN);
        expect(row.last4).toBe("6ajd");
    });

    test("replaces an existing token instead of adding a row", async () => {
        await reset();
        await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: TOKEN }),
        });
        const first = await (await api("/token", { cookie: user.cookie })).json();

        // updated_at has millisecond resolution; make the change observable
        await Bun.sleep(15);

        const res = await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: OTHER_TOKEN }),
        });
        const after = await (await api("/token", { cookie: user.cookie })).json();

        expect(res.status).toBe(200);
        expect(after.last4).toBe("8xyz");
        expect(after.createdAt).toBe(first.createdAt);
        expect(Date.parse(after.updatedAt)).toBeGreaterThan(
            Date.parse(first.updatedAt),
        );

        const rows = await withDb(
            (sql) =>
                sql`select rt.id from railway_token rt join "user" u on u.id = rt.user_id
                    where u.email = ${user.email}`,
        );
        expect(rows).toHaveLength(1);
    });

    test("trims surrounding whitespace before saving", async () => {
        await reset();

        const res = await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: `  ${TOKEN}  ` }),
        });

        expect(await res.json()).toEqual({ connected: true, last4: "6ajd" });

        const [row] = await withDb(
            (sql) =>
                sql`select rt.encrypted_token from railway_token rt
                    join "user" u on u.id = rt.user_id where u.email = ${user.email}`,
        );
        expect(decryptToken(row.encrypted_token)).toBe(TOKEN);
    });

    test.each([
        ["an empty token", { token: "" }],
        ["a whitespace-only token", { token: "   " }],
        ["a missing token field", {}],
        ["a non-string token", { token: 12345 }],
        ["a null token", { token: null }],
        ["a token over 500 chars", { token: "x".repeat(501) }],
    ])("rejects %s with 400", async (_label, body) => {
        const res = await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify(body),
        });

        expect(res.status).toBe(400);
    });

    test("rejects malformed JSON with 400", async () => {
        const res = await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: "not json",
        });

        expect(res.status).toBe(400);
    });

    test("accepts a token of exactly 500 chars (boundary)", async () => {
        await reset();

        const res = await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: "y".repeat(500) }),
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ connected: true, last4: "yyyy" });
    });

    test("a rejected request leaves any existing token untouched", async () => {
        await reset();
        await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: TOKEN }),
        });

        await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: "" }),
        });

        const body = await (await api("/token", { cookie: user.cookie })).json();
        expect(body).toMatchObject({ connected: true, last4: "6ajd" });
    });
});

describe("DELETE /token", () => {
    test("removes a saved token", async () => {
        await reset();
        await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: TOKEN }),
        });

        const res = await api("/token", { method: "DELETE", cookie: user.cookie });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ connected: false });
        expect(await (await api("/token", { cookie: user.cookie })).json()).toEqual({
            connected: false,
        });
    });

    test("is 404 when there is nothing to delete", async () => {
        await reset();

        const res = await api("/token", { method: "DELETE", cookie: user.cookie });

        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: "No token found" });
    });
});

describe("user isolation", () => {
    test("one user cannot see or delete another user's token", async () => {
        const other = await signUpTestUser();

        await api("/token", {
            method: "POST",
            cookie: user.cookie,
            body: JSON.stringify({ token: TOKEN }),
        });
        await api("/token", {
            method: "POST",
            cookie: other.cookie,
            body: JSON.stringify({ token: OTHER_TOKEN }),
        });

        const mine = await (await api("/token", { cookie: user.cookie })).json();
        const theirs = await (await api("/token", { cookie: other.cookie })).json();

        expect(mine.last4).toBe("6ajd");
        expect(theirs.last4).toBe("8xyz");

        // deleting theirs must not touch mine
        await api("/token", { method: "DELETE", cookie: other.cookie });

        expect(
            await (await api("/token", { cookie: user.cookie })).json(),
        ).toMatchObject({ connected: true, last4: "6ajd" });
    });
});

describe("saveTokenSchema", () => {
    test("accepts a valid token and strips whitespace", () => {
        const result = saveTokenSchema.safeParse({ token: "  abcd  " });

        expect(result.success).toBe(true);
        expect(result.data?.token).toBe("abcd");
    });

    test.each([
        ["empty", ""],
        ["whitespace only", "   "],
        ["too long", "x".repeat(501)],
    ])("rejects %s", (_label, token) => {
        expect(saveTokenSchema.safeParse({ token }).success).toBe(false);
    });
});
