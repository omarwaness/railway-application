import { z } from "zod";

/**
 * Reduces however a repo was pasted in to the bare `owner/repo` Railway wants.
 *
 * Railway derives the service name from the repo half, so a browser URL or an
 * SSH remote gets it nothing to derive from and comes back as
 * `invalid source name: ""` — an error that names neither the field nor the
 * fix. Everything that can wrap a full name is peeled off here instead: the
 * scheme, an SSH prefix, the host, a query or fragment, a `.git` suffix, and
 * any path past the repo itself (`/tree/main`).
 */
export function normalizeRepo(value: string) {
    const [path = ""] = value
        .trim()
        .replace(/^git@[^:]+:/i, "")
        .replace(/^[a-z][a-z\d+.-]*:\/\//i, "")
        .split(/[?#]/);

    const segments = path
        .replace(/\.git$/i, "")
        .split("/")
        .filter(Boolean);

    // A dot in the first segment marks it as a host: GitHub owners are
    // alphanumerics and hyphens, never dotted.
    if (segments[0]?.includes(".")) segments.shift();

    return segments.slice(0, 2).join("/");
}

/**
 * A repo's full name. Accepts anything that carries one — `owner/repo`, the
 * URL from the address bar, an SSH remote — and rejects what still isn't both
 * halves once normalized, rather than leaving Railway to complain about it.
 */
export const repoFullName = z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform(normalizeRepo)
    .refine(
        (value) => /^[\w.-]+\/[\w.-]+$/.test(value),
        'Repo must look like "owner/repo"',
    );
