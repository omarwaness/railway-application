import { betterAuth } from "better-auth";

import { db } from "../db/db"
import * as schema from "../db/schema";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
    database: drizzleAdapter(
        db,
        { provider: "pg", schema }
    ),
    emailAndPassword: {
        enabled: true,
    },
});