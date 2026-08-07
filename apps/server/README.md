# Server

A REST API over Railway's GraphQL API. Users sign in, save their own Railway
API token, and every request is then made to Railway on their behalf — so the
front end talks plain JSON and never handles a Railway token itself.

Built with [Hono](https://hono.dev) on Bun, [better-auth](https://better-auth.com)
for sessions, Drizzle + Postgres for storage, and `graphql-request` for the
Railway calls. Runs on port `4000`.

## How a request works

1. `authMiddleware` resolves the better-auth session, or 401s.
2. `tokenMiddleware` loads that user's Railway token, decrypts it, and puts it
   on the context as `c.get('railwayToken')`.
3. The route builds a per-user client with `createRailwayClient(token)` and
   sends one of the documents in [`src/gql/`](./src/gql), then reshapes the
   result into a flat JSON response.

Tokens are encrypted at rest with `ENCRYPTION_KEY` (see
[`src/lib/crypto.ts`](./src/lib/crypto.ts)); only the last 4 characters are
ever read back.

## Routes

| Prefix | Purpose |
| --- | --- |
| `/api/auth/*` | better-auth handler — email/password, Google, GitHub |
| `/token` | Save, inspect and remove the caller's Railway token |
| `/projects` | List, read, create, update, delete projects |
| `/environments` | Environments, environment logs, staged changes |
| `/services` | Services, per-environment config, source connect/disconnect |
| `/deployments` | History, logs, deploy, redeploy, rollback, stop, cancel |
| `/domains` | Railway domains and custom domains with DNS status |
| `/variables` | Read and write service and shared variables |

Everything except `/api/auth/*` requires a session; everything except `/token`
also requires a saved Railway token.

## Getting started

```bash
bun install
bun run migrate   # apply database migrations
bun run dev       # http://localhost:4000
```

`src/lib/env.ts` validates the environment at boot and fails with every
problem at once. Required: `DATABASE_URL`, `BETTER_AUTH_URL`,
`BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `RAILWAY_ENDPOINT` and
`ENCRYPTION_KEY` (32 bytes, base64).

| Script | Does |
| --- | --- |
| `bun run dev` | Start with hot reload |
| `bun run test` | Run the test suite |
| `bun run codegen` | Regenerate GraphQL types from Railway's schema |
| `bun run generate` | Generate a Drizzle migration |
| `bun run migrate` | Apply migrations |

## GraphQL documents

Every query, mutation and fragment the server sends lives in
[`src/gql/`](./src/gql), grouped by resource. Documents are written with
`graphql()` from `src/gql/generated/`, which GraphQL Code Generator produces
from Railway's schema (see [`codegen.ts`](./codegen.ts)) — run `bun run codegen`
after adding or editing one so the types stay in sync.

| File | Contents |
| --- | --- |
| [`queries.ts`](./src/gql/queries.ts) | Current user |
| [`project-queries.ts`](./src/gql/project-queries.ts) | Projects, workspaces |
| [`environment-queries.ts`](./src/gql/environment-queries.ts) | Environments, environment logs, staged changes |
| [`service-queries.ts`](./src/gql/service-queries.ts) | Services, service instances, service detail |
| [`deployment-queries.ts`](./src/gql/deployment-queries.ts) | Deployments, logs, deploy/redeploy/rollback |
| [`variable-queries.ts`](./src/gql/variable-queries.ts) | Environment and service variables |
| [`domain-queries.ts`](./src/gql/domain-queries.ts) | Railway domains, custom domains, DNS |

---

## Docs

Notes on each document — why fields are selected the way they are, and where
Railway's API differs from its documentation.

### Projects

#### `PROJECTS_QUERY`

Everything the dashboard needs in one round trip — the project grid plus the
workspaces for the switcher.

`apiToken` rides along as a second root field rather than a second request:
both are needed to paint the page, and GraphQL will resolve them in parallel.
See `WORKSPACES_QUERY` for why it's `apiToken` and not `me`.

`projects` spans every workspace the token can see, so pass `workspaceId` to
scope it. Services are capped because a card only renders a handful of icons —
note this makes `services.length` a *display* count, not the real total.
Nothing in this schema exposes one: no connection here has a `totalCount`, so
an exact figure would mean paging every project's services.

`deletedAt` is selected at both levels because Railway returns soft-deleted
projects regardless of `includeDeleted`, and the services connection has no
such arg at all — filtering client-side is the only control available. The
route passes both through untouched so the UI decides what to render.

#### `PROJECT_OVERVIEW_QUERY`

The `/projects/:id` page in one request: the project header, the environments
for the switcher, and the services running in the base environment.

Replaces `ENVIRONMENTS_QUERY` + `ENVIRONMENT_QUERY` + a `SERVICE_QUERY` per
row, so the page can load from a project id alone — the case on a direct URL or
a refresh. Once the user picks a different environment, switch to
`ENVIRONMENT_QUERY`; it selects the same `...ServiceRow` fragment, so the
rendered list needs no second shape.

`primaryEnvironmentId` is the environment to open on — NOT `baseEnvironment`,
which despite the name is where PR deploys fork from and stays null until PR
deploys are configured. Verified against the live API: a freshly created
project comes back with `baseEnvironmentId` null while `environments` already
holds the production environment it was created with. Selecting the wrong one
leaves the page with no environment id and every downstream call unusable.

There is no `primaryEnvironment` object field to go with the id — only the id —
which is why `serviceInstances` hangs off the environments connection here
rather than off one environment. The route matches the id against that list and
already holds the services, so this stays a single request. Environments the
user hasn't opened cost a service list each; that's the price of not making the
page wait on a second round trip.

`isEphemeral: false` keeps PR/preview environments out of the switcher by
default; pass `null` to include them.

Ordering note: `Project.environments` takes `sort`, not the `orderBy` the root
`environments` field uses. Left unset here — the switcher is short enough that
creation order reads fine.

#### `PROJECT_CREATE_MUTATION`

Create a project. Every field on `ProjectCreateInput` is optional, `name`
included — sending `{}` gets you a project with a Railway-generated name
(verified against the live API).

The selection mirrors the card fields in `PROJECTS_QUERY` so the result can be
spliced into the list without a refetch. `services` is omitted because a new
project has none; treat it as an empty array on the client.

#### `PROJECT_UPDATE_MUTATION`

Update a project's settings. All seven input fields are optional; send only the
ones being changed.

Note `workspaceId` is NOT updatable — moving a project between workspaces goes
through `projectTransfer`, not here.

#### `PROJECT_DELETE_MUTATION`

Delete a project immediately and irreversibly, along with every service,
environment, volume and deployment under it. Returns a bare Boolean.

Railway's own dashboard uses `projectScheduleDelete` instead, which applies a
48-hour grace period and can be undone with `projectScheduleDeleteCancel`.
Prefer that flow for anything user-facing; this one has no undo.

#### `WORKSPACES_QUERY`

Workspaces the current token can reach — powers the workspace switcher.

Uses `apiToken` rather than `me { workspaces }` on purpose: `me` resolves the
*user* behind the request and returns "Not Authorized" for workspace- and
project-scoped tokens, which is what most users will paste in. This field is
defined as "the current API token and its accessible workspaces", so it works
for account tokens too — at the cost of `avatar`, which `ApiTokenWorkspace`
doesn't expose (it only has `id` and `name`).

### Environments

#### `ENVIRONMENTS_QUERY`

Environments in a project — the environment switcher, and a prerequisite for
most of the rest of this API: `serviceInstance`, variables and deployments are
all keyed by an environment id.

`isEphemeral` is optional and tri-state by omission: leave it out for every
environment, `false` for the permanent ones only (production, staging), `true`
for just the PR/preview environments. Passing `false` is the usual choice for a
switcher, since preview environments come and go with pull requests and would
otherwise clutter it.

`deletedAt` is selected for the same reason as in `PROJECTS_QUERY` — Railway
returns soft-deleted rows and leaves the filtering to the caller.

#### `ENVIRONMENT_QUERY`

One environment plus every service running in it — what `/projects/:id`
re-fetches after the user switches environment.

`PROJECT_OVERVIEW_QUERY` covers the first load, since it can reach the base
environment from a project id alone. This one takes over once there's an
explicit environment to show, and selects the same `...ServiceRow` fragment so
the list renders from one shape either way.

This is the cheap way to build a service list: `serviceInstances` returns full
`ServiceInstance` nodes, so one round trip replaces N calls to
`serviceInstance(serviceId, environmentId)`. Only the summary fields are
selected here — reach for `SERVICE_DETAIL_QUERY` when opening one service.

`sourceEnvironment` is non-null only for forked environments and names the one
it was forked from. `unmergedChangesCount` is a count of dashboard-staged
changes not yet committed — see `ENVIRONMENT_STAGED_CHANGES_QUERY`.

#### `ENVIRONMENT_LOGS_QUERY`

Logs from every service in an environment at once — the project-wide log
stream, as opposed to `deploymentLogs`, which is scoped to one deployment.

`tags` is what makes the merged stream usable: each line carries the
`serviceId` and `deploymentId` it came from, so the UI can colour or filter by
service. Every tag field is nullable — platform-level lines have none.

Pagination is date-cursor based (`afterDate`/`afterLimit`,
`beforeDate`/`beforeLimit`, `anchorDate`), not the `startDate`/`endDate` pair
the build and deployment log queries take, and there is no `limit` argument at
all. Left off here until the route needs to page.

#### `ENVIRONMENT_STAGED_CHANGES_QUERY`

Changes staged in the dashboard but not yet committed.

Nothing this API does lands in here — mutations through the public API apply
immediately. This is purely a read on what someone staged in the Railway UI,
which matters because those pending changes are invisible to every other query
in this codebase: a service's config can look one way here and another way in
the dashboard until they're committed.

`status` is `STAGED`, `APPLYING` or `COMMITTED`. The actual diff lives in
`patch` (the `EnvironmentConfig` scalar) — a large untyped blob, deliberately
not selected; `unmergedChangesCount` on `ENVIRONMENT_QUERY` answers "is
anything pending?" more cheaply.

Note this returns `EnvironmentPatch!`, an object. Railway's docs show it with
no selection set, which won't validate.

#### `ENVIRONMENT_CREATE_MUTATION`

Create an environment. `name` and `projectId` are the only required fields, but
the optional ones change what you get in a big way:

| Field | Effect |
| --- | --- |
| `sourceEnvironmentId` | Fork — copies every service, volume, variable and config from that environment. Without it you get an empty environment. |
| `ephemeral` | Mark it as a preview environment, so it can be filtered out of `ENVIRONMENTS_QUERY`. |
| `skipInitialDeploys` | Create the services without deploying them. |
| `stageInitialChanges` | Stage rather than commit (default false, i.e. commit immediately). |
| `applyChangesInBackground` | Return as soon as the work is queued instead of waiting for it to finish. |

That last one is the one to think about at the route layer: with it true the
mutation returns an environment whose services don't exist yet, so the client
has to poll. Left to Railway's default here.

#### `ENVIRONMENT_RENAME_MUTATION`

Rename an environment. `EnvironmentRenameInput` is `{ name }` and nothing else
— renaming is the only mutable field.

Returns `Environment!`, so a selection set is required; Railway's docs show the
call with none, which won't validate.

Worth knowing before exposing this: variable references are by service name
(`${{ServiceName.VARIABLE_NAME}}`), not environment name, so a rename here
doesn't break them.

#### `ENVIRONMENT_DELETE_MUTATION`

Delete an environment and every deployment, variable and volume in it.
Irreversible, and returns a bare `Boolean!` — `false` means Railway declined
without saying why, same shape as `projectDelete` and `serviceDelete`.

Nothing in the schema stops you deleting the environment a project can't do
without — not its `primaryEnvironmentId` one, and not the last one it has — so
guard both in the route. (`baseEnvironmentId` is a different thing: where PR
deploys fork from, usually null. See `PROJECT_OVERVIEW_QUERY`.)

#### `ENVIRONMENT_PATCH_COMMIT_STAGED_MUTATION`

Commit whatever is staged in the dashboard, deploying the affected services.
The counterpart to `ENVIRONMENT_STAGED_CHANGES_QUERY`, and equally irrelevant
to changes made through this API — those are already live.

Returns a `String!` (the resulting patch id), not a Boolean.

`commitMessage` is free text shown in the environment's change history.
`skipDeploys` commits the config without rolling it out, which leaves the
running services out of sync with their stored config until something triggers
a deploy — deliberate for a batch, surprising by accident.

### Services

#### `SERVICE_ROW_FRAGMENT`

One row in a service list — name, icon and status, keyed off a
`ServiceInstance`.

It lives on `ServiceInstance` rather than `Service` because that's the only
type that reaches both halves of a row: status comes from `latestDeployment`,
while `icon` lives on `Service` and nowhere else. The nested `service { ... }`
is what avoids a `SERVICE_QUERY` per row.

`serviceId` is selected alongside `id` because they are different things: `id`
identifies the instance, `serviceId` is what the service routes take. Without
it the list can't link anywhere.

`latestDeployment` is null until the service has been deployed at least once,
so a brand-new service has no status to show. `staticUrl` is the stable service
URL — nullable until a domain exists, and the cheap way to give each row a link
without a `DOMAINS_QUERY` per service.

Spread by `PROJECT_OVERVIEW_QUERY` (base environment) and `ENVIRONMENT_QUERY`
(after an environment switch) so both render from one shape.

#### `SERVICE_QUERY`

A service's identity — the bits that are the same everywhere it runs.

Railway splits a service in two: `Service` holds what the thing *is* (name,
icon, which project owns it), while everything about how it *runs* lives on
`ServiceInstance`, one per environment. So there is no start command, region or
replica count here — that's `SERVICE_INSTANCE_QUERY`.

`deletedAt` is selected for the same reason as in `PROJECTS_QUERY`: Railway
hands back soft-deleted rows and leaves the filtering to us.

#### `SERVICE_CREATE_MUTATION`

Create a service. One mutation covers all three flavours — the only thing that
changes is `source`:

| Kind | `source` |
| --- | --- |
| Git repo | `{ repo: "owner/name" }`, optionally with `branch` |
| Image | `{ image: "redis:7-alpine" }` |
| Empty | omitted entirely |

`ServiceSourceInput` has exactly two fields, `repo` and `image`, both optional
— nothing stops you sending both, so the route validates that only one is set
rather than trusting the API to reject it.

Only `projectId` is required. `name` is optional and Railway generates one when
it's missing, same as `projectCreate`.

Beyond the obvious `name`/`icon`/`branch`/`variables`, the input also takes:

| Field | Notes |
| --- | --- |
| `environmentId` | Scopes creation to one environment, but only if that environment is a fork. Otherwise the service is created in every non-fork environment regardless. |
| `registryCredentials` | `{ username, password }` — both required together, for pulling a private image. |
| `templateId` + `templateServiceId` | Must be sent as a pair; for instantiating a service out of a template's serialized config. |

`variables` is Railway's `EnvironmentVariables` scalar, not `JSON` — a flat
string→string map (mapped to `Record<string, string>` in `codegen.ts`). Values
are strings on the wire even when they're numbers, so `PORT: "8080"`.

The selection mirrors `SERVICE_QUERY` so the new service can be spliced into a
list without a refetch.

#### `SERVICE_UPDATE_MUTATION`

Rename a service or change its icon. That is the whole surface:
`ServiceUpdateInput` has exactly two fields, `name` and `icon`, both optional —
so `{}` is accepted and does nothing. The route requires at least one field,
same as `projectUpdate`.

Deliberately narrow: this touches identity only. Everything about how the
service *runs* is per-environment and goes through `serviceInstanceUpdate`,
which takes `(serviceId, environmentId)` and returns a bare Boolean rather than
the updated record.

#### `SERVICE_CONNECT_MUTATION`

Point an existing service at a source. Despite the name, this isn't
GitHub-only: `ServiceConnectInput` is `{ repo, branch, image }`, all three
optional, so it also connects a service to a Dockerhub/GHCR image. Same
mutual-exclusion caveat as `serviceCreate` — repo and image can both be sent
and the route is what stops that. `serviceDisconnect(id)` is the inverse.

The return type is `Service`, which has no source field, so this can't echo
back what it just connected. Confirming the change means re-reading
`serviceInstance.source` — which is why `SERVICE_INSTANCE_QUERY` selects it.

Note `branch` is write-only through this path: `ServiceSource` exposes only
`repo` and `image`. To display the connected branch, read it from the service's
`repoTriggers` connection, whose nodes are `DeploymentTrigger`
(`{ branch, repository, environmentId, ... }`) — one per environment.

#### `SERVICE_DISCONNECT_MUTATION`

Detach a service from its source — the inverse of `SERVICE_CONNECT_MUTATION`.
Takes only `id`: there's no input type and no way to disconnect just one
environment, so this clears the source everywhere at once.

Returns `Service`, so it has the same blind spot as `serviceConnect` — the
result can't show that the source is gone, because `Service` has no source
field. Re-read `serviceInstance.source` (now null) to confirm.

The service itself survives with its deployments intact; only the link to the
repo or image goes away.

#### `SERVICE_INSTANCE_QUERY`

How a service is configured in one environment — the service detail page.

Keyed by `(serviceId, environmentId)` because the same service can be deployed
differently per environment: staging on one replica, production on three,
different start commands, different regions.

Almost every config field is nullable, and null means "not set, Railway
decides" rather than "empty" — a null `startCommand` runs whatever the builder
detected, a null `region` uses the workspace default. Render those as
placeholders, not blanks. The two exceptions are `restartPolicyType` and
`restartPolicyMaxRetries`, which are non-null and always carry a real value.

`latestDeployment` is null until the service has been deployed at least once,
so a brand-new service shows no status. `activeDeployments` (not selected) is
the field to reach for if the UI ever needs to show a rollout in progress
alongside the previous version.

#### `SERVICE_DETAIL_QUERY`

The whole service detail panel in one request — settings, variables and
actions.

Batches four root-level reads that the UI would otherwise fire separately:
`SERVICE_INSTANCE_QUERY`, `DOMAINS_QUERY`, `VARIABLES_QUERY` and
`DEPLOYMENTS_QUERY`. Two of them fold in structurally rather than just sitting
alongside — `serviceInstance.domains` needs no arguments at all (the
project/environment/service triple `DOMAINS_QUERY` takes is already implied by
its parent), and `serviceInstance.service` covers the panel header. `variables`
and `deployments` stay as sibling root fields; GraphQL resolves all three in
parallel.

The actions tab gates on `canRedeploy`, `canRollback` and `deploymentStopped` —
Railway's own verdicts on which mutations will work, which is more reliable
than inferring from `status`.

`unrendered` defaults to true because this feeds an editor: rendering
references first and saving back would bake `${{Postgres.DATABASE_URL}}` into a
literal. Flip it to false for a read-only view. See `VARIABLES_QUERY` for the
full story.

Two things to know before leaning on this. One slow field gates the whole
response, so the panel paints at the speed of its slowest part. And variable
values land in the same payload as everything else — if the variables tab ends
up lazy-loaded, pull `variables` back out into its own request.

The four originals stay: `SERVICE_INSTANCE_QUERY` is still the right re-read
after `serviceInstanceUpdate`, and `DEPLOYMENTS_QUERY` is what pages the
history past the first `$deploymentLimit`.

#### `SERVICE_DELETE_MUTATION`

Delete a service and everything under it — deployments, variables, domains.
Irreversible, and returns a bare `Boolean!`, so `false` means Railway declined
without saying why (same shape as `projectDelete`).

Deletes the service everywhere. The mutation also accepts an optional
`environmentId`, deliberately not exposed here: Railway flags it
[Experimental], and it only narrows the delete when the environment is a
*fork* — pass a normal environment id and the service is still removed from
every non-fork environment. A per-environment delete arg that usually doesn't
scope the delete is a trap worth leaving out until it's needed.

#### `SERVICE_INSTANCE_UPDATE_MUTATION`

Edit a service's per-environment config — the write half of
`SERVICE_INSTANCE_QUERY`, and the only mutation that touches these fields.

Scoped to `(serviceId, environmentId)` for the same reason the read is: staging
and production are separate rows. `environmentId` is declared `String!` here
even though the schema allows omitting it, because a config edit that silently
lands in every environment is not something a route should be able to do by
accident.

`ServiceInstanceUpdateInput` is a superset of what we read back — beyond the
fields in `SERVICE_INSTANCE_QUERY` it also accepts `builder`, `cronSchedule`,
`dockerfilePath`, `sleepApplication`, `watchPatterns`, `preDeployCommand`,
`drainingSeconds`, `overlapSeconds`, `source`, `registryCredentials`,
`nixpacksPlan`, `railwayConfigFile`, `ipv6EgressEnabled` and
`multiRegionConfig`. Every one is optional; send only what changed.

Returns a bare `Boolean!` — no updated record, no indication of which fields
took. Applying immediately (the API has no staged-changes model; that's a
dashboard-only concept), so the route should re-run `SERVICE_INSTANCE_QUERY`
afterwards and return the fresh instance. Without that the client has no
confirmation of what it just wrote.

### Deployments

#### `DEPLOYMENTS_QUERY`

Deployment history for a service in one environment.

`DeploymentListInput` is all-optional — `projectId`, `serviceId`,
`environmentId`, `status`, `includeDeleted` — so it widens as you drop fields:
omit `serviceId` for every deployment in an environment, omit `environmentId`
for every deployment in a project. The route decides how far to open that up.

The status filter is `{ in: [...] }` / `{ notIn: [...] }` over
`DeploymentStatus` values. Railway's docs mention a `successfulOnly` flag; it
does not exist in the schema. The current running deployment is this query with
`first: 1` and `status: { in: [SUCCESS] }`.

`url` is the deployment's own URL and `staticUrl` the stable service URL; both
are nullable until a domain exists.

#### `DEPLOYMENT_QUERY`

A single deployment — the poll target for the id `serviceInstanceDeployV2`
returns, and the only way to find out whether a deploy actually succeeded.

`canRedeploy` and `canRollback` are Railway's own verdicts on whether those
mutations will work; gate the buttons on them rather than guessing from
`status`. `meta` is available too — commit info for repo deploys, tag info for
images — but it's a large undocumented blob, so it stays unselected until
something actually renders it.

`statusUpdatedAt` says when the status last moved, which is what tells a poller
the difference between "still building" and "stuck".

#### `BUILD_LOGS_QUERY`

Build-time logs — everything the builder printed before the container ran.
Separate from runtime logs, and the split is by phase, not by stream: a failed
build has output here and nothing in `deploymentLogs`.

`filter` takes Railway's log query syntax; `startDate`/`endDate` bound the
window. Both are optional, but `limit` matters — the field returns a plain list
with no pagination, so an unbounded call on a noisy build is a big response.

#### `DEPLOYMENT_LOGS_QUERY`

Runtime logs — stdout/stderr from the running container. Same arguments and
same no-pagination caveat as `BUILD_LOGS_QUERY`.

`severity` is a nullable String, not an enum: anything not written to a
recognised stream comes back null, so don't switch on it exhaustively.

#### `HTTP_LOGS_QUERY`

HTTP access logs from Railway's edge — one row per request, only for
deployments that serve traffic through a domain.

Note the pagination arguments differ from the other two log queries: these are
date-cursor based (`afterDate`/`afterLimit`, `beforeDate`/`beforeLimit`,
`anchorDate`) rather than `startDate`/`endDate`, so a shared log-fetching
helper won't cover all three.

The selection is the subset worth showing in a table. `HttpLog` also carries
`rxBytes`/`txBytes`, `upstreamRqDuration`, `upstreamErrors`, `edgeRegion`,
`clientUa` and `host` if the UI ever needs request detail.

#### `SERVICE_INSTANCE_DEPLOY_MUTATION`

Deploy a service in one environment. Returns the new deployment's id as a bare
`String!` — feed it to `deployment(id:)` to poll status, since nothing here
reports whether the build succeeded.

`commitSha` is optional and declared as `String` (not `String!`) so this one
document covers both cases: omit it to deploy the commit currently pinned to
the service, or pass one to deploy a specific commit — the HEAD of a connected
branch, say, or an older SHA to roll back. Railway validates the SHA against
the connected repo and fails with "Commit not found" without creating a
deployment, so a bad SHA is a no-op rather than a broken deploy.

V2 is the one to use. The older `serviceInstanceDeploy` returns a bare Boolean
instead of an id — leaving no handle to track the deployment with — and swaps
`commitSha` for a coarser `latestCommit: Boolean`.

#### `SERVICE_INSTANCE_REDEPLOY_MUTATION`

Re-run the latest deployment as-is, on the commit it already has.

This never consults the connected repo, so it will not pick up new commits —
it's the "that failed for environmental reasons, try again" button. To ship
something new, use `SERVICE_INSTANCE_DEPLOY_MUTATION` with a `commitSha`.

Returns `Boolean!`, not a deployment id, so unlike deployV2 there's no handle
to poll with; re-read `serviceInstance.latestDeployment` for status.

#### `ENVIRONMENT_TRIGGERS_DEPLOY_MUTATION`

Deploy a service via the environment's triggers. Reaches the same end as
`SERVICE_INSTANCE_DEPLOY_MUTATION` but takes `projectId` as well and returns a
bare Boolean, so there's no deployment id to poll.

Prefer deployV2 for "deploy this service". This one is the lever to pull when
the deploy should follow the environment's configured triggers rather than a
specific commit.

#### `DEPLOYMENT_REDEPLOY_MUTATION`

Redeploy an existing deployment by id — the deployment-scoped counterpart to
`SERVICE_INSTANCE_REDEPLOY_MUTATION`, and the better of the two: it returns a
full `Deployment!` rather than a Boolean, so the new record comes back without
a follow-up read.

Gate on `canRedeploy` from `DEPLOYMENT_QUERY`. The mutation also accepts
`usePreviousImageTag: Boolean` to reuse the already-built image instead of
rebuilding; not exposed here until there's a use for it.

#### `DEPLOYMENT_RESTART_MUTATION`

Restart a running deployment without rebuilding — same image, same commit,
fresh container. Returns `Boolean!`.

#### `DEPLOYMENT_ROLLBACK_MUTATION`

Roll back to a previous deployment. Only valid where `canRollback` is true.

Returns `Boolean!` — Railway's docs show it selecting `{ id status }`, but the
schema says otherwise, so there's no rolled-back record to return. Re-read the
service instance's `latestDeployment` afterwards.

#### `DEPLOYMENT_STOP_MUTATION`

Stop a running deployment. Returns `Boolean!`.

#### `DEPLOYMENT_CANCEL_MUTATION`

Cancel a deployment that hasn't finished yet — `QUEUED`, `WAITING`,
`INITIALIZING`, `BUILDING` or `DEPLOYING`. Returns `Boolean!`; a `false` on a
deployment that already settled is the expected answer, not an error.

#### `DEPLOYMENT_REMOVE_MUTATION`

Remove a deployment from the history. Returns `Boolean!`.

Distinct from `deploymentStop`: stopping halts a running deployment but leaves
the record, removing takes the record out of the list. Removed deployments
still surface in `DEPLOYMENTS_QUERY` with status `REMOVED` unless filtered out.

### Variables

#### `VARIABLES_QUERY`

Variables for a service in one environment.

The field returns Railway's `EnvironmentVariables` scalar — a flat name→value
map, not a list of objects, so there are no sub-fields to select and no ids to
delete by. Codegen types it as `Record<string, string>` (see the scalar mapping
in `codegen.ts`). Values are always strings.

`serviceId` is optional and the omission is meaningful, not a shortcut: leave
it out and you get the environment's *shared* variables instead of a service's
own. Same field, different scope — worth making explicit in the route rather
than letting an undefined id silently widen the query.

`unrendered: true` returns references verbatim (`${{Postgres.DATABASE_URL}}`)
instead of their resolved values. That's the one to use for an editor —
rendering first and saving back would bake the reference into a literal.
Default (false) resolves them, which is what a read-only view wants.

#### `VARIABLES_FOR_DEPLOYMENT_QUERY`

Every variable a deployment would actually see, fully resolved — service
variables merged with shared ones, all references expanded, plus whatever
Railway injects itself.

Different from `VARIABLES_QUERY` with `unrendered: false`, which only returns
variables set at that scope. This is the deployment's real environment, so it's
the query for a "what will this container get?" view. `serviceId` is required
here — there's no shared-variable form.

#### `VARIABLE_UPSERT_MUTATION`

Create or overwrite one variable. There is no separate create — upsert is the
only write, keyed by `name` within `(projectId, environmentId, serviceId)`.
Returns `Boolean!`.

`serviceId` omitted writes a shared variable, mirroring `VARIABLES_QUERY`.

The one optional field is `skipDeploys`. Without it, every write triggers a
redeploy of the affected services — so a form that saves five variables one at
a time causes five deploys. Set it when writing in a batch (or rotating
secrets) and trigger the deploy yourself afterwards.

Values may contain references in `${{ServiceName.VARIABLE_NAME}}` form; they're
stored literally and resolved at deploy time.

#### `VARIABLE_COLLECTION_UPSERT_MUTATION`

Write many variables in one call — the right tool for a bulk editor, a `.env`
import, or copying variables between environments. Returns `Boolean!`.

`variables` is the same name→value map the read returns, so a
fetch-edit-save round trip needs no reshaping.

Two optional fields, and `replace` is the dangerous one: `replace: true`
deletes every variable *not* present in the payload, making this a full
overwrite rather than a merge. Only safe when the payload was built from a
complete read of the same scope. Default (false) merges.

`skipDeploys` works as it does on the single upsert — one deploy for the whole
batch instead of none, but still worth suppressing during a migration.

#### `VARIABLE_DELETE_MUTATION`

Delete one variable by name. Returns `Boolean!`.

`VariableDeleteInput` is `{ projectId, environmentId, serviceId?, name }` —
note there's no `skipDeploys` here, unlike the upserts, so a delete always
triggers a deploy. Clearing several variables is cheaper through
`VARIABLE_COLLECTION_UPSERT_MUTATION` with `replace: true`.

As everywhere in this file, omitting `serviceId` targets the environment's
shared variables.

### Domains

#### `DOMAINS_QUERY`

Every domain pointing at a service in one environment — both the
Railway-provided `*.up.railway.app` ones and any custom domains.

This is where a service's public URL actually lives; nothing on `Service` or
`ServiceInstance` exposes it. `Deployment.staticUrl` is the cheap alternative
when you only need *a* URL and already hold a deployment.

`AllDomains` is a plain object with two lists, not a connection — no
pagination, no cursors.

On the DNS records: `recordType` and `fqdn` are selected beyond what the docs
show because a setup guide can't be rendered without them — you can't tell the
user to add a CNAME versus a TXT otherwise. `purpose` distinguishes the routing
record from the ownership-verification one.

#### `CUSTOM_DOMAIN_AVAILABLE_QUERY`

Whether a custom domain can be attached — call before `customDomainCreate` so
the user gets a reason instead of a mutation error.

`message` is non-null and populated whether or not the domain is available, so
show it either way. `serviceDomainAvailable(domain:)` is the equivalent check
for the `*.railway.app` side.

#### `CUSTOM_DOMAIN_QUERY`

One custom domain's DNS and certificate state — the polling target while a user
works through setup.

Note it needs `projectId` alongside the domain id.

The status enums are not what Railway's docs claim. `DNSRecordStatus` is
`DNS_RECORD_STATUS_PROPAGATED` / `_REQUIRES_UPDATE` / `_UNSPECIFIED` /
`UNRECOGNIZED` (not PENDING/VALID/INVALID), and `CertificateStatus` is
`CERTIFICATE_STATUS_TYPE_VALID` / `_ISSUING` / `_VALIDATING_OWNERSHIP` /
`_ISSUE_FAILED` / `_UNSPECIFIED` / `UNRECOGNIZED` (not PENDING/ISSUED/FAILED).
Match on the real values.

`certificateErrorMessage` and `certificateRetryable` are selected because a
failed certificate is the case a user most needs explained — and retryable
failures can be re-driven with `customDomainIssueCertificate(id:)`.

#### `SERVICE_DOMAIN_CREATE_MUTATION`

Generate a Railway domain for a service. The name is assigned by Railway —
there's no way to request one, so the input is just
`{ serviceId, environmentId }` plus an optional `targetPort`.

`targetPort` is the container port traffic is forwarded to. Omit it and Railway
infers one; set it when the service listens somewhere non-obvious.

`syncStatus` is selected because a freshly created domain comes back
`CREATING`, not `ACTIVE` — it isn't serving traffic the instant this returns.

#### `SERVICE_DOMAIN_DELETE_MUTATION`

Remove a Railway-provided domain. Returns `Boolean!`.

#### `CUSTOM_DOMAIN_CREATE_MUTATION`

Attach a custom domain to a service. Input is
`{ projectId, environmentId, serviceId, domain }` with an optional
`targetPort`.

The domain does not work when this returns — it comes back unverified, and the
user has to add DNS records first. Two of them, and the second is easy to miss:
the routing record from `status.dnsRecords`, *and* a TXT record built from
`status.verificationToken`, which is a separate field rather than an entry in
that list. Without the TXT record the domain stays pending forever. Both are
selected here so the response alone is enough to render setup instructions.

Railway publishes no static IP, so root domains need CNAME-flattening, ALIAS or
ANAME — A records are not supported.

#### `CUSTOM_DOMAIN_UPDATE_MUTATION`

Change which container port a custom domain forwards to. `targetPort` is the
only thing that can be updated, and it's nullable — passing null clears the
override and returns the domain to inferred routing.

Takes loose arguments rather than an input type, needs `environmentId`
alongside the id, and returns `Boolean!` — so re-read with
`CUSTOM_DOMAIN_QUERY` to confirm.

#### `CUSTOM_DOMAIN_DELETE_MUTATION`

Detach a custom domain. Returns `Boolean!`.

Only removes it from Railway — the user's DNS records still point here until
they clean them up, so a route that deletes should say so.
