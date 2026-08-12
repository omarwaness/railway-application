import { Command } from "commander";

import { ApiError, messageFor, readBody, request } from "../lib/api";
import { clearSession, saveSession } from "../lib/config";
import { PromptCancelled, promptSecret, promptText } from "../lib/prompt";

/** better-auth mounts its handler here; the server passes it `/api/auth/*`. */
const SIGN_IN_PATH = "/api/auth/sign-in/email";

interface LoginOptions {
    email?: string;
}

/** The half of better-auth's sign-in response worth reporting back. */
interface SignInResponse {
    user?: { email?: string };
}

/**
 * Reduces `Set-Cookie` to the `Cookie` header it implies. Only the name=value
 * pair survives — the attributes after it (Path, HttpOnly, Max-Age) describe
 * how a browser should store the cookie, and a request never sends them back.
 */
function cookieHeaderFrom(response: Response): string | null {
    const pairs = response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0]?.trim() ?? "")
        .filter((pair) => pair.includes("="));

    return pairs.length > 0 ? pairs.join("; ") : null;
}

async function run(options: LoginOptions) {
    const email = options.email ?? (await promptText("Email: "));
    if (!email) throw new Error("An email is required.");

    const password = await promptSecret("Password: ");
    if (!password) throw new Error("A password is required.");

    const response = await request(SIGN_IN_PATH, {
        method: "POST",
        body: { email, password },
        anonymous: true,
    });

    const payload = await readBody(response);

    if (!response.ok) {
        // better-auth answers a bad credential with 401 and its own message,
        // which names the field rather than saying which half was wrong.
        const message =
            response.status === 401
                ? "Invalid email or password."
                : messageFor(payload, response.status);

        throw new ApiError(message, response.status, payload);
    }

    const cookie = cookieHeaderFrom(response);

    if (!cookie) {
        throw new Error(
            "Signed in, but the server sent no session cookie — nothing to save.",
        );
    }

    const path = await saveSession(cookie);
    const { user } = (payload ?? {}) as SignInResponse;

    console.log(`Signed in as ${user?.email ?? email}`);
    console.log(`  session saved to ${path}`);
}

export function loginCommand(): Command {
    return new Command("login")
        .description("sign in and save a session for this machine")
        .option("-e, --email <email>", "email to sign in with; prompted for when omitted")
        .action(async (options: LoginOptions) => {
            try {
                await run(options);
            } catch (error) {
                if (error instanceof PromptCancelled) {
                    process.exitCode = 130;
                    return;
                }

                throw error;
            }
        });
}

export function logoutCommand(): Command {
    return new Command("logout")
        .description("forget the saved session")
        .action(async () => {
            const had = await clearSession();
            console.log(had ? "Signed out." : "Not signed in.");
        });
}
