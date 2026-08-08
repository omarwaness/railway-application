import { betterAuth } from "better-auth";

import { db } from "../db/db"
import { env } from "./env";
import * as schema from "../db/schema";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
    database: drizzleAdapter(
        db,
        { provider: "pg", schema }
    ),
    // The client lives on another origin; without it here better-auth rejects
    // its sign-in calls and post-OAuth redirects back to it.
    trustedOrigins: [env.CLIENT_URL],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
});