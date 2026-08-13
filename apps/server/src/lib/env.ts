import "dotenv/config";
import { z } from "zod";

const KEY_LENGTH = 32; // 256 bits, must match `crypto.ts`

const urlSchema = z
    .string()
    .min(1)
    .refine((value) => URL.canParse(value), "must be a valid URL");

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    // Railway assigns the port at runtime and expects the process to bind it;
    // binding a fixed port instead is what makes a deploy fail healthchecks with
    // no open ports detected. The default is only for local runs.
    PORT: z.coerce.number().int().positive().max(65535).default(4000),
    // The browser's Origin header never carries a trailing slash, so it's
    // stripped here rather than at each use site — CORS matches the string exactly.
    CLIENT_URL: urlSchema.transform((value) => value.replace(/\/+$/, "")),
    // Set this to the domain the client and API share — ".example.com" — when
    // both run on subdomains of one registrable domain. That makes the session
    // cookie same-site, which is the only arrangement no browser interferes
    // with. Leave it unset and `auth.ts` falls back to cross-site cookies; see
    // the comment there for what that costs.
    COOKIE_DOMAIN: z
        .string()
        .min(1)
        .refine(
            (value) => value.startsWith(".") && value.includes(".", 1),
            'must be a parent domain starting with a dot, e.g. ".example.com"',
        )
        .optional(),
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

    throw new Error(
        `Invalid environment variables (from .env locally, from the service's variables in production):\n${problems}`,
    );
}

export const env = parsed.data;

/** True when running a deployed build, not a local `bun dev`. */
export const isProduction = env.NODE_ENV === "production";
