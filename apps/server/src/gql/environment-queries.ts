import { graphql } from './generated'

/**
 * Environments in a project — the environment switcher, and a prerequisite for
 * most of the rest of this API: `serviceInstance`, variables and deployments
 * are all keyed by an environment id.
 *
 * `isEphemeral` is optional and tri-state by omission: leave it out for every
 * environment, `false` for the permanent ones only (production, staging),
 * `true` for just the PR/preview environments. Passing `false` is the usual
 * choice for a switcher, since preview environments come and go with pull
 * requests and would otherwise clutter it.
 *
 * `deletedAt` is selected for the same reason as in PROJECTS_QUERY — Railway
 * returns soft-deleted rows and leaves the filtering to the caller.
 */
export const ENVIRONMENTS_QUERY = graphql(`
   query Environments(
      $projectId: String!
      $isEphemeral: Boolean
      $first: Int = 20
      $after: String
   ) {
      environments(
         projectId: $projectId
         isEphemeral: $isEphemeral
         first: $first
         after: $after
      ) {
         edges {
            node {
               id
               name
               createdAt
               updatedAt
               deletedAt
               isEphemeral
               projectId
            }
         }
         pageInfo {
            hasNextPage
            endCursor
         }
      }
   }
`)

/**
 * One environment plus every service running in it — what /projects/:id
 * re-fetches after the user switches environment.
 *
 * PROJECT_OVERVIEW_QUERY covers the first load, since it can reach the base
 * environment from a project id alone. This one takes over once there's an
 * explicit environment to show, and selects the same ...ServiceRow fragment so
 * the list renders from one shape either way.
 *
 * This is the cheap way to build a service list: `serviceInstances` returns
 * full `ServiceInstance` nodes, so one round trip replaces N calls to
 * `serviceInstance(serviceId, environmentId)`. Only the summary fields are
 * selected here — reach for SERVICE_DETAIL_QUERY when opening one service.
 *
 * `sourceEnvironment` is non-null only for forked environments and names the
 * one it was forked from. `unmergedChangesCount` is a count of dashboard-
 * staged changes not yet committed — see ENVIRONMENT_STAGED_CHANGES_QUERY.
 */
export const ENVIRONMENT_QUERY = graphql(`
   query Environment($id: String!, $projectId: String) {
      environment(id: $id, projectId: $projectId) {
         id
         name
         createdAt
         updatedAt
         isEphemeral
         projectId
         unmergedChangesCount
         sourceEnvironment {
            id
            name
         }
         serviceInstances {
            edges {
               node {
                  ...ServiceRow
               }
            }
         }
      }
   }
`)

/**
 * Logs from every service in an environment at once — the project-wide log
 * stream, as opposed to `deploymentLogs`, which is scoped to one deployment.
 *
 * `tags` is what makes the merged stream usable: each line carries the
 * `serviceId` and `deploymentId` it came from, so the UI can colour or filter
 * by service. Every tag field is nullable — platform-level lines have none.
 *
 * Pagination is date-cursor based (`afterDate`/`afterLimit`,
 * `beforeDate`/`beforeLimit`, `anchorDate`), not the `startDate`/`endDate`
 * pair the build and deployment log queries take, and there is no `limit`
 * argument at all. Left off here until the route needs to page.
 */
export const ENVIRONMENT_LOGS_QUERY = graphql(`
   query EnvironmentLogs($environmentId: String!, $filter: String) {
      environmentLogs(environmentId: $environmentId, filter: $filter) {
         timestamp
         message
         severity
         tags {
            serviceId
            deploymentId
         }
      }
   }
`)

/**
 * Changes staged in the dashboard but not yet committed.
 *
 * Nothing this API does lands in here — mutations through the public API apply
 * immediately. This is purely a read on what someone staged in the Railway UI,
 * which matters because those pending changes are invisible to every other
 * query in this codebase: a service's config can look one way here and another
 * way in the dashboard until they're committed.
 *
 * `status` is STAGED, APPLYING or COMMITTED. The actual diff lives in `patch`
 * (the `EnvironmentConfig` scalar) — a large untyped blob, deliberately not
 * selected; `unmergedChangesCount` on ENVIRONMENT_QUERY answers "is anything
 * pending?" more cheaply.
 *
 * Note this returns `EnvironmentPatch!`, an object. Railway's docs show it
 * with no selection set, which won't validate.
 */
export const ENVIRONMENT_STAGED_CHANGES_QUERY = graphql(`
   query EnvironmentStagedChanges($environmentId: String!) {
      environmentStagedChanges(environmentId: $environmentId) {
         id
         status
         message
         createdAt
         updatedAt
         appliedAt
         lastAppliedError
      }
   }
`)

/**
 * Create an environment. `name` and `projectId` are the only required fields,
 * but the optional ones change what you get in a big way:
 *
 *   sourceEnvironmentId     fork — copies every service, volume, variable and
 *                           config from that environment. Without it you get
 *                           an empty environment.
 *   ephemeral               mark it as a preview environment, so it can be
 *                           filtered out of ENVIRONMENTS_QUERY.
 *   skipInitialDeploys      create the services without deploying them.
 *   stageInitialChanges     stage rather than commit (default false, i.e.
 *                           commit immediately).
 *   applyChangesInBackground  return as soon as the work is queued instead of
 *                           waiting for it to finish.
 *
 * That last one is the one to think about at the route layer: with it true the
 * mutation returns an environment whose services don't exist yet, so the
 * client has to poll. Left to Railway's default here.
 */
export const ENVIRONMENT_CREATE_MUTATION = graphql(`
   mutation EnvironmentCreate($input: EnvironmentCreateInput!) {
      environmentCreate(input: $input) {
         id
         name
         createdAt
         isEphemeral
         projectId
         sourceEnvironment {
            id
            name
         }
      }
   }
`)

/**
 * Rename an environment. `EnvironmentRenameInput` is `{ name }` and nothing
 * else — renaming is the only mutable field.
 *
 * Returns `Environment!`, so a selection set is required; Railway's docs show
 * the call with none, which won't validate.
 *
 * Worth knowing before exposing this: variable references are by service name
 * (`${{Postgres.DATABASE_URL}}`), not environment name, so a rename here
 * doesn't break them.
 */
export const ENVIRONMENT_RENAME_MUTATION = graphql(`
   mutation EnvironmentRename($id: String!, $input: EnvironmentRenameInput!) {
      environmentRename(id: $id, input: $input) {
         id
         name
         updatedAt
      }
   }
`)

/**
 * Delete an environment and every deployment, variable and volume in it.
 * Irreversible, and returns a bare `Boolean!` — `false` means Railway declined
 * without saying why, same shape as `projectDelete` and `serviceDelete`.
 *
 * Nothing in the schema stops you deleting the project's base environment
 * (`baseEnvironmentId` on PROJECTS_QUERY), so guard that in the route.
 */
export const ENVIRONMENT_DELETE_MUTATION = graphql(`
   mutation EnvironmentDelete($id: String!) {
      environmentDelete(id: $id)
   }
`)

/**
 * Commit whatever is staged in the dashboard, deploying the affected services.
 * The counterpart to ENVIRONMENT_STAGED_CHANGES_QUERY, and equally irrelevant
 * to changes made through this API — those are already live.
 *
 * Returns a `String!` (the resulting patch id), not a Boolean.
 *
 * `commitMessage` is free text shown in the environment's change history.
 * `skipDeploys` commits the config without rolling it out, which leaves the
 * running services out of sync with their stored config until something
 * triggers a deploy — deliberate for a batch, surprising by accident.
 */
export const ENVIRONMENT_PATCH_COMMIT_STAGED_MUTATION = graphql(`
   mutation EnvironmentPatchCommitStaged(
      $environmentId: String!
      $commitMessage: String
      $skipDeploys: Boolean
   ) {
      environmentPatchCommitStaged(
         environmentId: $environmentId
         commitMessage: $commitMessage
         skipDeploys: $skipDeploys
      )
   }
`)
