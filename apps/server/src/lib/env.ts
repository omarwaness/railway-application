import "dotenv/config";
import { z } from "zod";

const KEY_LENGTH = 32; // 256 bits, must match `crypto.ts`

const urlSchema = z
    .string()
    .min(1)
    .refine((value) => URL.canParse(value), "must be a valid URL");

const envSchema = z.object({
    // The browser's Origin header never carries a trailing slash, so it's
    // stripped here rather than at each use site — CORS matches the string exactly.
    CLIENT_URL: urlSchema.transform((value) => value.replace(/\/+$/, "")),
    DATABASE_URL: urlSchema,
    BETTER_AUTH_URL: urlSchema,
    BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
    GOOGLE_CLIENT_ID: z
        .string()
        .min(1)
        .refine(
            (value) => value.endsWith(".apps.googleusercontent.com"),
            "must be a Google OAuth client ID (ends with .apps.googleusercontent.com)",
        ),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    RAILWAY_ENDPOINT: urlSchema,
    ENCRYPTION_KEY: z
        .string()
        .min(1)
        .refine(
            (value) => Buffer.from(value, "base64").length === KEY_LENGTH,
            `must decode to exactly ${KEY_LENGTH} bytes of base64`,
        ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    // Print every problem at once rather than one boot failure at a time, and
    // name only the variables — never echo the values, they're all secrets.
    const problems = parsed.error.issues
        .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");

    throw new Error(`Invalid environment variables in .env:\n${problems}`);
}

export const env = parsed.data;
