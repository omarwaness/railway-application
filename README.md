# railway-controller

A monorepo powered by [Bun](https://bun.sh) that consumes Railway's GraphQL API.

## Structure

- `apps/client` — Next.js UI
- `apps/server` — Hono API, Postgres via Drizzle, auth via better-auth
- `packages/cli` — `rw` command-line client

## Getting started

```bash
bun install
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
# fill in apps/server/.env, then:
bun run --cwd apps/server migrate
bun run --cwd apps/server dev   # :4000
bun run --cwd apps/client dev   # :3000
```

---

# Deploying to Railway

Two services in one Railway project, both built from this repo's root so Bun
can resolve the workspace.

## 1. Postgres

Add a Postgres database to the project first — the API references its
connection string.

## 2. Server service

| Setting | Value |
| --- | --- |
| Root Directory | `/` (repo root — the workspace install needs it) |
| Config-as-code path | `apps/server/railway.json` |

[apps/server/railway.json](apps/server/railway.json) supplies the build, start,
healthcheck, and a pre-deploy command that runs migrations. Migrations run
through `drizzle-orm`'s migrator rather than the `drizzle-kit` CLI, because
drizzle-kit is a devDependency and won't exist in a production install.

Variables — everything in [apps/server/.env.example](apps/server/.env.example),
with these differences from local:

```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
CLIENT_URL=https://<client public domain>
BETTER_AUTH_URL=https://<server public domain>
```

Do **not** set `PORT` — Railway injects it, and the app binds whatever it's
given. Generate the two secrets with `openssl rand -base64 32`.

> **Back up `ENCRYPTION_KEY` before the first deploy.** It's the AES-256-GCM key
> for every stored Railway token. Lose or rotate it and all of them become
> undecryptable; every user has to reconnect.

## 3. Client service

| Setting | Value |
| --- | --- |
| Root Directory | `/` |
| Config-as-code path | `apps/client/railway.json` |

```
NEXT_PUBLIC_SERVER_URL=https://${{server.RAILWAY_PUBLIC_DOMAIN}}
```

`NEXT_PUBLIC_*` values are **inlined at build time**, not read at runtime.
Changing this variable requires a rebuild — a restart won't pick it up.

## 4. OAuth redirect URIs

Register both against the *server's* public domain:

- Google — `https://<server domain>/api/auth/callback/google`
- GitHub — `https://<server domain>/api/auth/callback/github`

## 5. Session cookies — read this before going live

The client calls the API cross-origin with `credentials: "include"`, so the
browser must be willing to send the session cookie to a different origin. What
that takes depends entirely on the domains, and the default Railway setup is
the awkward case:

**`up.railway.app` is on the [Public Suffix List](https://publicsuffix.org/).**
So `client-x.up.railway.app` and `server-y.up.railway.app` are separate
registrable domains — not sibling subdomains. Browsers treat them as different
*sites*, and a `SameSite=Lax` cookie is never sent between them.

With `NODE_ENV=production` and no `COOKIE_DOMAIN`, the API issues the cookie as
`SameSite=None; Secure`, which is what makes that work. The catch is that it's
then a third-party cookie, and **Safari blocks those by default** — sign-in will
fail for Safari users.

The fix is to put both services on subdomains of one domain you own:

1. Add custom domains — `app.example.com` for the client,
   `api.example.com` for the server.
2. Set `COOKIE_DOMAIN=.example.com` on the server.
3. Update `CLIENT_URL`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SERVER_URL`, and both
   OAuth redirect URIs to match — then rebuild the client.

The cookie becomes `SameSite=Lax; Secure; Domain=.example.com`: same-site, and
untouched by any browser's third-party cookie policy. See the comment block in
[apps/server/src/lib/auth.ts](apps/server/src/lib/auth.ts) for the reasoning,
including why `Partitioned` is deliberately not used.

## Deploy checklist

- [ ] Postgres added; `DATABASE_URL` references it
- [ ] `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY` generated, and `ENCRYPTION_KEY` backed up
- [ ] `NODE_ENV=production` on the server
- [ ] `PORT` **not** set on either service
- [ ] `CLIENT_URL` / `BETTER_AUTH_URL` / `NEXT_PUBLIC_SERVER_URL` all point at real public domains, no trailing slashes
- [ ] OAuth redirect URIs registered with Google and GitHub
- [ ] Cookie strategy chosen — custom subdomains + `COOKIE_DOMAIN`, or accept that Safari sign-in fails
- [ ] Server healthcheck green at `/health`
- [ ] Sign-in verified end to end in a browser, including a hard refresh
