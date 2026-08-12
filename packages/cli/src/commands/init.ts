import { Command } from "commander";

import { api } from "../lib/api";
import { clearLocalToken, TOKEN_FILE } from "../lib/config";
import { confirm, PromptCancelled, promptSecret } from "../lib/prompt";

/** Where Railway issues the API token this CLI asks for. */
const RAILWAY_TOKENS_URL = "https://railway.com/account/tokens";

interface InitOptions {
    force?: boolean;
}

/** `GET /token` — whether the account has a token, and its last 4 chars if so. */
type TokenStatus = { connected: false } | { connected: true; last4: string };

/** `POST /token` — the token is written back encrypted, so only last4 returns. */
interface SaveTokenResponse {
    connected: boolean;
    last4: string;
}

async function resolveToken(provided?: string): Promise<string> {
    if (provided) return provided.trim();

    // Passing the token as an argument leaves it in shell history, so the
    // prompt is the default path and it doesn't echo.
    return (await promptSecret("Railway API token: ")).trim();
}

async function run(provided: string | undefined, options: InitOptions) {
    if (!options.force) {
        const status = await api<TokenStatus>("/token");

        if (status.connected) {
            const replace = await confirm(
                `A token ending in ${status.last4} is already saved. Replace it?`,
            );

            if (!replace) {
                console.log("Kept the existing token.");
                return;
            }
        }
    }

    const token = await resolveToken(provided);

    if (!token) {
        console.error(
            "No token provided.\n" +
                `Create one at ${RAILWAY_TOKENS_URL}, then run \`rw init\` again.`,
        );
        process.exitCode = 1;
        return;
    }

    const { last4 } = await api<SaveTokenResponse>("/token", {
        method: "POST",
        body: { token },
    });

    console.log(`Token saved to your account (ends in ${last4}).`);

    // Earlier versions kept the token here instead; it's dead weight now.
    if (await clearLocalToken()) {
        console.log(`Removed the local copy at ${TOKEN_FILE}.`);
    }
}

export function initCommand(): Command {
    return new Command("init")
        .description("save your Railway API token to your account")
        .argument("[token]", "token to save; prompted for when omitted")
        .option("-f, --force", "overwrite an existing token without asking")
        .action(async (provided: string | undefined, options: InitOptions) => {
            try {
                await run(provided, options);
            } catch (error) {
                if (error instanceof PromptCancelled) {
                    process.exitCode = 130;
                    return;
                }

                throw error;
            }
        });
}
