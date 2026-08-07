import { graphql } from './generated'

/**
 * Deployment history for a service in one environment.
 *
 * `DeploymentListInput` is all-optional — `projectId`, `serviceId`,
 * `environmentId`, `status`, `includeDeleted` — so it widens as you drop
 * fields: omit `serviceId` for every deployment in an environment, omit
 * `environmentId` for every deployment in a project. The route decides how far
 * to open that up.
 *
 * The status filter is `{ in: [...] }` / `{ notIn: [...] }` over
 * DeploymentStatus values. Railway's docs mention a `successfulOnly` flag; it
 * does not exist in the schema. The current running deployment is this query
 * with `first: 1` and `status: { in: [SUCCESS] }`.
 *
 * `url` is the deployment's own URL and `staticUrl` the stable service URL;
 * both are nullable until a domain exists.
 */
export const DEPLOYMENTS_QUERY = graphql(`
   query Deployments($input: DeploymentListInput!, $first: Int = 10, $after: String) {
      deployments(input: $input, first: $first, after: $after) {
         edges {
            node {
               id
               status
               createdAt
               url
               staticUrl
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
 * A single deployment — the poll target for the id `serviceInstanceDeployV2`
 * returns, and the only way to find out whether a deploy actually succeeded.
 *
 * `canRedeploy` and `canRollback` are Railway's own verdicts on whether those
 * mutations will work; gate the buttons on them rather than guessing from
 * `status`. `meta` is available too — commit info for repo deploys, tag info
 * for images — but it's a large undocumented blob, so it stays unselected
 * until something actually renders it.
 *
 * `statusUpdatedAt` says when the status last moved, which is what tells a
 * poller the difference between "still building" and "stuck".
 */
export const DEPLOYMENT_QUERY = graphql(`
   query Deployment($id: String!) {
      deployment(id: $id) {
         id
         status
         statusUpdatedAt
         createdAt
         url
         staticUrl
         canRedeploy
         canRollback
         deploymentStopped
         serviceId
         environmentId
         projectId
      }
   }
`)

/**
 * Build-time logs — everything the builder printed before the container ran.
 * Separate from runtime logs, and the split is by phase, not by stream: a
 * failed build has output here and nothing in `deploymentLogs`.
 *
 * `filter` takes Railway's log query syntax; `startDate`/`endDate` bound the
 * window. Both are optional, but `limit` matters — the field returns a plain
 * list with no pagination, so an unbounded call on a noisy build is a big
 * response.
 */
export const BUILD_LOGS_QUERY = graphql(`
   query BuildLogs(
      $deploymentId: String!
      $limit: Int = 500
      $filter: String
      $startDate: DateTime
      $endDate: DateTime
   ) {
      buildLogs(
         deploymentId: $deploymentId
         limit: $limit
         filter: $filter
         startDate: $startDate
         endDate: $endDate
      ) {
         timestamp
         message
         severity
      }
   }
`)

/**
 * Runtime logs — stdout/stderr from the running container. Same arguments and
 * same no-pagination caveat as BUILD_LOGS_QUERY.
 *
 * `severity` is a nullable String, not an enum: anything not written to a
 * recognised stream comes back null, so don't switch on it exhaustively.
 */
export const DEPLOYMENT_LOGS_QUERY = graphql(`
   query DeploymentLogs(
      $deploymentId: String!
      $limit: Int = 500
      $filter: String
      $startDate: DateTime
      $endDate: DateTime
   ) {
      deploymentLogs(
         deploymentId: $deploymentId
         limit: $limit
         filter: $filter
         startDate: $startDate
         endDate: $endDate
      ) {
         timestamp
         message
         severity
      }
   }
`)

/**
 * HTTP access logs from Railway's edge — one row per request, only for
 * deployments that serve traffic through a domain.
 *
 * Note the pagination arguments differ from the other two log queries: these
 * are date-cursor based (`afterDate`/`afterLimit`, `beforeDate`/`beforeLimit`,
 * `anchorDate`) rather than `startDate`/`endDate`, so a shared log-fetching
 * helper won't cover all three.
 *
 * The selection is the subset worth showing in a table. `HttpLog` also carries
 * `rxBytes`/`txBytes`, `upstreamRqDuration`, `upstreamErrors`, `edgeRegion`,
 * `clientUa` and `host` if the UI ever needs request detail.
 */
export const HTTP_LOGS_QUERY = graphql(`
   query HttpLogs($deploymentId: String!, $limit: Int = 100, $filter: String) {
      httpLogs(deploymentId: $deploymentId, limit: $limit, filter: $filter) {
         timestamp
         requestId
         method
         path
         httpStatus
         totalDuration
         srcIp
      }
   }
`)

/**
 * Deploy a service in one environment. Returns the new deployment's id as a
 * bare `String!` — feed it to `deployment(id:)` to poll status, since nothing
 * here reports whether the build succeeded.
 *
 * `commitSha` is optional and declared as `String` (not `String!`) so this one
 * document covers both cases: omit it to deploy the commit currently pinned to
 * the service, or pass one to deploy a specific commit — the HEAD of a
 * connected branch, say, or an older SHA to roll back. Railway validates the
 * SHA against the connected repo and fails with "Commit not found" without
 * creating a deployment, so a bad SHA is a no-op rather than a broken deploy.
 *
 * V2 is the one to use. The older `serviceInstanceDeploy` returns a bare
 * Boolean instead of an id — leaving no handle to track the deployment with —
 * and swaps `commitSha` for a coarser `latestCommit: Boolean`.
 */
export const SERVICE_INSTANCE_DEPLOY_MUTATION = graphql(`
   mutation ServiceInstanceDeploy(
      $serviceId: String!
      $environmentId: String!
      $commitSha: String
   ) {
      serviceInstanceDeployV2(
         serviceId: $serviceId
         environmentId: $environmentId
         commitSha: $commitSha
      )
   }
`)

/**
 * Re-run the latest deployment as-is, on the commit it already has.
 *
 * This never consults the connected repo, so it will not pick up new commits —
 * it's the "that failed for environmental reasons, try again" button. To ship
 * something new, use SERVICE_INSTANCE_DEPLOY_MUTATION with a `commitSha`.
 *
 * Returns `Boolean!`, not a deployment id, so unlike deployV2 there's no
 * handle to poll with; re-read `serviceInstance.latestDeployment` for status.
 */
export const SERVICE_INSTANCE_REDEPLOY_MUTATION = graphql(`
   mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
   }
`)

/**
 * Deploy a service via the environment's triggers. Reaches the same end as
 * SERVICE_INSTANCE_DEPLOY_MUTATION but takes `projectId` as well and returns a
 * bare Boolean, so there's no deployment id to poll.
 *
 * Prefer deployV2 for "deploy this service". This one is the lever to pull
 * when the deploy should follow the environment's configured triggers rather
 * than a specific commit.
 */
export const ENVIRONMENT_TRIGGERS_DEPLOY_MUTATION = graphql(`
   mutation EnvironmentTriggersDeploy($input: EnvironmentTriggersDeployInput!) {
      environmentTriggersDeploy(input: $input)
   }
`)

/**
 * Redeploy an existing deployment by id — the deployment-scoped counterpart to
 * SERVICE_INSTANCE_REDEPLOY_MUTATION, and the better of the two: it returns a
 * full `Deployment!` rather than a Boolean, so the new record comes back
 * without a follow-up read.
 *
 * Gate on `canRedeploy` from DEPLOYMENT_QUERY. The mutation also accepts
 * `usePreviousImageTag: Boolean` to reuse the already-built image instead of
 * rebuilding; not exposed here until there's a use for it.
 */
export const DEPLOYMENT_REDEPLOY_MUTATION = graphql(`
   mutation DeploymentRedeploy($id: String!) {
      deploymentRedeploy(id: $id) {
         id
         status
         createdAt
      }
   }
`)

/**
 * Restart a running deployment without rebuilding — same image, same commit,
 * fresh container. Returns `Boolean!`.
 */
export const DEPLOYMENT_RESTART_MUTATION = graphql(`
   mutation DeploymentRestart($id: String!) {
      deploymentRestart(id: $id)
   }
`)

/**
 * Roll back to a previous deployment. Only valid where `canRollback` is true.
 *
 * Returns `Boolean!` — Railway's docs show it selecting `{ id status }`, but
 * the schema says otherwise, so there's no rolled-back record to return.
 * Re-read the service instance's `latestDeployment` afterwards.
 */
export const DEPLOYMENT_ROLLBACK_MUTATION = graphql(`
   mutation DeploymentRollback($id: String!) {
      deploymentRollback(id: $id)
   }
`)

/** Stop a running deployment. Returns `Boolean!`. */
export const DEPLOYMENT_STOP_MUTATION = graphql(`
   mutation DeploymentStop($id: String!) {
      deploymentStop(id: $id)
   }
`)

/**
 * Cancel a deployment that hasn't finished yet — QUEUED, WAITING,
 * INITIALIZING, BUILDING or DEPLOYING. Returns `Boolean!`; a `false` on a
 * deployment that already settled is the expected answer, not an error.
 */
export const DEPLOYMENT_CANCEL_MUTATION = graphql(`
   mutation DeploymentCancel($id: String!) {
      deploymentCancel(id: $id)
   }
`)

/**
 * Remove a deployment from the history. Returns `Boolean!`.
 *
 * Distinct from `deploymentStop`: stopping halts a running deployment but
 * leaves the record, removing takes the record out of the list. Removed
 * deployments still surface in DEPLOYMENTS_QUERY with status REMOVED unless
 * filtered out.
 */
export const DEPLOYMENT_REMOVE_MUTATION = graphql(`
   mutation DeploymentRemove($id: String!) {
      deploymentRemove(id: $id)
   }
`)
