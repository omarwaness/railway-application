import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/** Everything the CLI persists lives here, owner-only. */
const CONFIG_DIR = join(homedir(), ".rw");

/** The Railway API token, on its own so it can carry the tightest permissions. */
const TOKEN_FILE = join(CONFIG_DIR, "token");

/**
 * The `Cookie` header that authenticates against our own API. The server's
 * routes sit behind better-auth, so this — not the Railway token — is what
 * every request needs.
 */
const SESSION_FILE = join(CONFIG_DIR, "session");

const DIR_MODE = 0o700;
const FILE_MODE = 0o600;

/**
 * Windows ignores POSIX modes, so `chmod` alone leaves the token readable by
 * every account on the machine. `icacls` is the equivalent: drop inherited
 * ACEs, then grant the current user full control and nobody else.
 */
async function restrictOnWindows(path: string): Promise<void> {
    const user = process.env.USERNAME;
    if (!user) return;

    const domain = process.env.USERDOMAIN;
    const principal = domain ? `${domain}\\${user}` : user;

    const proc = Bun.spawn(
        [
            "icacls",
            path,
            "/inheritance:r",
            "/grant:r",
            `${principal}:(OI)(CI)F`,
        ],
        { stdout: "ignore", stderr: "pipe" },
    );

    if ((await proc.exited) !== 0) {
        const reason = (await new Response(proc.stderr).text()).trim();
        console.warn(
            `warning: could not restrict permissions on ${path}` +
            (reason ? `\n  ${reason}` : ""),
        );
    }
}

/** Creates the config directory if it's missing and locks it down. */
async function ensureConfigDir(): Promise<void> {
    await mkdir(CONFIG_DIR, { recursive: true, mode: DIR_MODE });

    // `mkdir`'s mode only applies to a directory it actually creates, so an
    // existing one — possibly created before this ran — is re-hardened here.
    await chmod(CONFIG_DIR, DIR_MODE);

    if (process.platform === "win32") {
        await restrictOnWindows(CONFIG_DIR);
    }
}

/** Returns the stored session cookie, or null when not signed in. */
export async function readSession(): Promise<string | null> {
    try {
        const value = (await readFile(SESSION_FILE, "utf8")).trim();
        return value || null;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
    }
}

/**
 * Stores the session cookie readable only by the current user. It's protected
 * by filesystem permissions, not encryption: anyone who can read it as this
 * user — including anything this user runs — can use the session.
 */
export async function saveSession(cookie: string): Promise<string> {
    await ensureConfigDir();

    await writeFile(SESSION_FILE, `${cookie}\n`, { mode: FILE_MODE });
    await chmod(SESSION_FILE, FILE_MODE);

    return SESSION_FILE;
}

/** Deletes the saved session. Returns whether there was one to delete. */
export async function clearSession(): Promise<boolean> {
    return await remove(SESSION_FILE);
}

/**
 * Deletes the token file earlier versions of `rw init` wrote. The token lives
 * in the database now, so a copy left here is a secret at rest with nothing
 * reading it.
 */
export async function clearLocalToken(): Promise<boolean> {
    return await remove(TOKEN_FILE);
}

/** Deletes a file, reporting whether there was one. */
async function remove(path: string): Promise<boolean> {
    try {
        await rm(path);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
        throw error;
    }
}

export { CONFIG_DIR, SESSION_FILE, TOKEN_FILE };
