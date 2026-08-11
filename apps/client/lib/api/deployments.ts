import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { queryKeys, type DeploymentFilters } from "@/lib/api/keys"
import { rpc, unwrap } from "@/lib/rpc"
import { isInFlight } from "@/lib/deployment-status"

/** Which service's deployment history to read — every field is required. */
type ServiceDeploymentScope = {
  projectId: string
  environmentId: string
  serviceId: string
}

/**
 * Enough history to fill the panel without paging. The route caps `first` at
 * 100; nothing here reads the cursor, so asking for more would only be data
 * the drawer never shows.
 */
const HISTORY_LIMIT = 20

/**
 * One service's deployments in one environment, newest first — the same order
 * Railway returns them in.
 *
 * The list refetches on its own while the newest deployment is still moving,
 * because a build that finishes upstream produces no event here. It stops as
 * soon as that deployment settles, so an idle drawer costs nothing.
 */
function serviceDeploymentsQueryOptions(scope: ServiceDeploymentScope) {
  const { projectId, environmentId, serviceId } = scope

  const filters: DeploymentFilters = {
    projectId,
    environmentId,
    serviceId,
    first: HISTORY_LIMIT,
  }

  return queryOptions({
    queryKey: queryKeys.deployments.list(filters),
    queryFn: () =>
      unwrap(
        rpc.deployments.$get({
          query: {
            projectId,
            environmentId,
            serviceId,
            first: String(HISTORY_LIMIT),
          },
        })
      ),
    refetchInterval: (query) => {
      const latest = query.state.data?.deployments[0]
      return latest && isInFlight(latest.status) ? 5_000 : false
    },
  })
}

/**
 * How much of each stream to pull. Neither logs route pages — they take a
 * `limit` and return a plain array — so this is the whole request, and an
 * empty array is an ordinary answer: a deployment that never built has no
 * build logs, one that never served traffic has no HTTP logs.
 */
const LOG_LIMIT = 500
const HTTP_LOG_LIMIT = 100

/**
 * Logs are the most volatile thing the API serves, so they refetch on mount
 * rather than reading a cache that's already 30 seconds behind. The console
 * only mounts when its tab is selected inside an expanded panel, which is what
 * keeps that from being three requests every time the drawer opens.
 */
const LOG_QUERY = { staleTime: 0 } as const

/** Build-time output. A failed build has lines here and nothing in the runtime stream. */
function buildLogsQueryOptions(deploymentId: string) {
  return queryOptions({
    ...LOG_QUERY,
    queryKey: queryKeys.deployments.buildLogs(deploymentId, {
      limit: LOG_LIMIT,
    }),
    queryFn: () =>
      unwrap(
        rpc.deployments[":id"]["build-logs"].$get({
          param: { id: deploymentId },
          query: { limit: String(LOG_LIMIT) },
        })
      ),
  })
}

/** stdout and stderr from the running container. */
function runtimeLogsQueryOptions(deploymentId: string) {
  return queryOptions({
    ...LOG_QUERY,
    queryKey: queryKeys.deployments.logs(deploymentId, { limit: LOG_LIMIT }),
    queryFn: () =>
      unwrap(
        rpc.deployments[":id"].logs.$get({
          param: { id: deploymentId },
          query: { limit: String(LOG_LIMIT) },
        })
      ),
  })
}

/** Edge access logs — only ever populated for a deployment behind a domain. */
function httpLogsQueryOptions(deploymentId: string) {
  return queryOptions({
    ...LOG_QUERY,
    queryKey: queryKeys.deployments.httpLogs(deploymentId, {
      limit: HTTP_LOG_LIMIT,
    }),
    queryFn: () =>
      unwrap(
        rpc.deployments[":id"]["http-logs"].$get({
          param: { id: deploymentId },
          query: { limit: String(HTTP_LOG_LIMIT) },
        })
      ),
  })
}

/**
 * One deployment in full. The list route returns neither `canRedeploy` nor
 * `canRollback`, and those are what say whether an action is offerable at all
 * — so a card that shows actions reads its own deployment here.
 */
function deploymentQueryOptions(deploymentId: string) {
  return queryOptions({
    queryKey: queryKeys.deployments.detail(deploymentId),
    queryFn: () =>
      unwrap(rpc.deployments[":id"].$get({ param: { id: deploymentId } })),
  })
}

/**
 * Build and ship a service as it's configured right now, without a deployment
 * to start from. Railway doesn't build a service when its source is attached,
 * so until this runs once there's nothing to redeploy — which is what makes it
 * the only way out of an empty history.
 *
 * The commit is left to Railway: `commitSha` ships a specific one, and the
 * service already points at the branch it should build.
 */
function useDeployService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ serviceId, environmentId }: ServiceDeploymentScope) =>
      unwrap(rpc.deployments.$post({ json: { serviceId, environmentId } })),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.byId(projectId),
      })
    },
  })
}

/**
 * Which deployment to act on, and the project it belongs to — the project is
 * only there for invalidation, since the overview carries the `latestDeployment`
 * the canvas nodes draw their status dots from.
 */
type DeploymentAction = {
  deploymentId: string
  projectId: string
}

/**
 * Every action reports back the same way: nothing upstream returns the settled
 * result, so the answer is always to re-read. `deployments.all()` is a prefix
 * over both the history list and each deployment's own record.
 */
function useDeploymentAction<T>(request: (deploymentId: string) => Promise<T>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deploymentId }: DeploymentAction) => request(deploymentId),
    onSuccess: (_result, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.byId(projectId),
      })
    },
  })
}

/** Build and ship this deployment again. Only where `canRedeploy` is true. */
function useRedeployDeployment() {
  return useDeploymentAction((id) =>
    unwrap(rpc.deployments[":id"].redeploy.$post({ param: { id } }))
  )
}

/** Same image, same commit, fresh container — no rebuild. */
function useRestartDeployment() {
  return useDeploymentAction((id) =>
    unwrap(rpc.deployments[":id"].restart.$post({ param: { id } }))
  )
}

/**
 * Stop a deployment that hasn't settled yet. The route answers 409 once it
 * has, which surfaces as an ordinary error message rather than a failure.
 */
function useCancelDeployment() {
  return useDeploymentAction((id) =>
    unwrap(rpc.deployments[":id"].cancel.$post({ param: { id } }))
  )
}

export {
  serviceDeploymentsQueryOptions,
  deploymentQueryOptions,
  buildLogsQueryOptions,
  runtimeLogsQueryOptions,
  httpLogsQueryOptions,
  useDeployService,
  useRedeployDeployment,
  useRestartDeployment,
  useCancelDeployment,
  HISTORY_LIMIT,
  LOG_LIMIT,
  HTTP_LOG_LIMIT,
}
export type { ServiceDeploymentScope, DeploymentAction }
