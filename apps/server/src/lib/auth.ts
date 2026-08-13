import { betterAuth } from "better-auth";

import { db } from "../db/db"
import { env, isProduction } from "./env";
import * as schema from "../db/schema";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/**
 * Where the session cookie is allowed to travel.
 *
 * The client sends every API call with `credentials: "include"` from a
 * different origin, so the only question that matters is whether the browser
 * considers the two origins the same *site* — same registrable domain — or not.
 *
 * - Locally both apps are on `localhost`, which is same-site. better-auth's
 *   default `SameSite=Lax` works untouched, and overriding it would actively
 *   break dev: `SameSite=None` requires `Secure`, and `Secure` cookies don't
 *   survive plain http.
 *
 * - With `COOKIE_DOMAIN` set — the client on `app.example.com`, the API on
 *   `api.example.com` — the cookie is scoped to the shared parent and stays
 *   same-site. This is the arrangement to prefer: it's the only one that no
 *   browser's third-party cookie policy touches.
 *
 * - With it unset in production, the two are assumed to be genuinely
 *   cross-site. That's what two Railway services get by default, because
 *   `up.railway.app` is on the Public Suffix List — `client-x.up.railway.app`
 *   and `server-y.up.railway.app` are separate registrable domains, not
 *   siblings, so a Lax cookie is never sent and every authed request 401s.
 *   `SameSite=None; Secure` is what makes it work, at the cost of being a
 *   third-party cookie: Safari blocks those by default, so sign-in will fail
 *   there. Attach custom subdomains and set `COOKIE_DOMAIN` to escape that.
 *
 * Deliberately not `Partitioned`: CHIPS keys the cookie to the top-level site,
 * and the OAuth callback sets it while the *API* is the top-level site. The
 * client would then look under a different partition and find nothing.
 */
const cookieConfig = (() => {
    if (!isProduction) return {};

    if (env.COOKIE_DOMAIN) {
        return {
            crossSubDomainCookies: {
                enabled: true,
                domain: env.COOKIE_DOMAIN,
            },
        };
    }

    return {
        defaultCookieAttributes: {
            // `as const` so this stays the literal "none" rather than widening
            // to `string`, which better-auth's union type rejects.
            sameSite: "none" as const,
            secure: true,
        },
    };
})();

export const auth = betterAuth({
    database: drizzleAdapter(
        db,
        { provider: "pg", schema }
    ),
    // better-auth would read this from the environment on its own, but passing
    // the validated value keeps every consumer of `BETTER_AUTH_URL` agreeing on
    // one string — and `crossSubDomainCookies` throws without a baseURL.
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    // The client lives on another origin; without it here better-auth rejects
    // its sign-in calls and post-OAuth redirects back to it.
    trustedOrigins: [env.CLIENT_URL],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
        github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
        },
    },
    advanced: {
        // Behind Railway's proxy the app speaks http internally while the
        // browser is on https, so the protocol sniff would drop the `__Secure-`
        // prefix and the `Secure` flag exactly where they're needed.
        useSecureCookies: isProduction,
        ...cookieConfig,
    },
});
