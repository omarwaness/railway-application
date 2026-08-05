import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { railwayToken } from '../db/schemas/token';
import { decryptToken } from '../lib/crypto';
import { HonoEnv } from '../types';

/**
 * Loads the caller's Railway token and exposes the plaintext as
 * `c.get('railwayToken')`. Must run after `authMiddleware`.
 */
export const tokenMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user');

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const [row] = await db
        .select({ encryptedToken: railwayToken.encryptedToken })
        .from(railwayToken)
        .where(eq(railwayToken.userId, user.id));

    if (!row) {
        return c.json({ error: 'No Railway token found' }, 404);
    }

    let token: string;
    try {
        token = decryptToken(row.encryptedToken);
    } catch {
        // Corrupt row, or ENCRYPTION_KEY changed since the token was saved.
        // Nothing the caller can do but save the token again.
        return c.json({ error: 'Could not read your Railway token, please save it again' }, 422);
    }

    c.set('railwayToken', token);
    await next();
});

// Ready-to-spread headers for a Railway API call.
export const railwayAuthHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
});
