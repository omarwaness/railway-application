import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";

import { db } from "../db/db";
import { railwayToken } from "../db/schemas/token";
import { eq } from "drizzle-orm";

import { encryptToken } from "../lib/crypto";
import { authMiddleware } from "../middlewares/auth.middleware";
import type { HonoEnv } from "../types";

const app = new Hono<HonoEnv>().use(authMiddleware);

export const saveTokenSchema = z.object({
    token: z.string().trim().min(1, "Token is required").max(500, "Token is too long"),
});

const routes = app
    // Whether the user has a token, and the last 4 chars if so.
    .get("/", async (c) => {
        const user = c.get("user");

        const [row] = await db
            .select({
                last4: railwayToken.last4,
                createdAt: railwayToken.createdAt,
                updatedAt: railwayToken.updatedAt,
            })
            .from(railwayToken)
            .where(eq(railwayToken.userId, user.id));

        if (!row) {
            return c.json({ connected: false });
        }

        return c.json({
            connected: true,
            last4: row.last4,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    })

    // Save the user's token, replacing an existing one.
    .post("/", sValidator("json", saveTokenSchema), async (c) => {
        const user = c.get("user");

        const { token } = c.req.valid("json");
        const last4 = token.slice(-4);
        const encryptedToken = encryptToken(token);

        await db
            .insert(railwayToken)
            .values({
                userId: user.id,
                encryptedToken,
                last4,
            })
            .onConflictDoUpdate({
                target: railwayToken.userId,
                set: {
                    encryptedToken,
                    last4,
                    updatedAt: new Date(),
                },
            });

        return c.json({ connected: true, last4 });
    })

    // Remove the user's token.
    .delete("/", async (c) => {
        const user = c.get("user");

        const deleted = await db
            .delete(railwayToken)
            .where(eq(railwayToken.userId, user.id))
            .returning({ id: railwayToken.id });

        if (deleted.length === 0) {
            return c.json({ error: "No token found" }, 404);
        }

        return c.json({ connected: false });
    });

export default routes;
