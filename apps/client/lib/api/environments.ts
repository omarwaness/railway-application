import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/keys"
import type { EnvironmentService, ProjectOverview } from "@/lib/api/projects"
import {
  rpc,
  unwrap,
  type InferRequestType,
  type InferResponseType,
} from "@/lib/rpc"

/**
 * One environment plus the services running in it — what the project page
 * reads after the header's switcher moves off the primary environment. The
 * overview route carries service lists for the primary environment only, so
 * every other environment is fetched here.
 */
type EnvironmentDetail = InferResponseType<
  (typeof rpc.environments)[":id"]["$get"],
  200
>

/**
 * `projectId` is optional upstream but always passed here: it scopes the
 * lookup to the project the page is already on.
 */
function environmentQueryOptions(environmentId: string, projectId: string) {
  return queryOptions({
    queryKey: queryKeys.environments.detail(environmentId, { projectId }),
    queryFn: () =>
      unwrap(
        rpc.environments[":id"].$get({
          param: { id: environmentId },
          query: { projectId },
        })
      ),
  })
}

/**
 * The services running in whichever environment the page is pointed at.
 *
 * The overview already carries the primary environment's services, so only a
 * switch away from it costs a request — which is why this takes the overview
 * rather than fetching every environment the same way. Both the canvas and the
 * settings page read services this way, so a switch resolves identically in
 * each.
 */
function useEnvironmentServices(
  overview: ProjectOverview,
  environmentId?: string
): { services?: EnvironmentService[]; isLoading: boolean } {
  const primary = overview.primaryEnvironment
  const isPrimary = environmentId === primary?.id

  const { data, isPending } = useQuery({
    ...environmentQueryOptions(environmentId ?? "", overview.project.id),
    enabled: Boolean(environmentId) && !isPrimary,
  })

  return {
    services: isPrimary ? primary?.services : data?.services,
    // `isPending` stays true for a disabled query, so this only counts while an
    // environment other than the primary one is actually being fetched.
    isLoading: !isPrimary && isPending,
  }
}

type CreateEnvironmentInput = InferRequestType<
  typeof rpc.environments.$post
>["json"]

/**
 * Create an environment, empty or forked from an existing one — passing
 * `sourceEnvironmentId` is what makes it a fork rather than a blank slate.
 *
 * The switcher and the settings list both read the environment list off the
 * project overview, so that's what goes stale; `environments` goes with it
 * because a fork arrives carrying the source's services.
 */
function useCreateEnvironment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEnvironmentInput) =>
      unwrap(rpc.environments.$post({ json: input })),
    onSuccess: (_data, { projectId }) => invalidate(queryClient, projectId),
  })
}

/** `projectId` isn't sent — it's here only to invalidate the overview. */
type RenameEnvironmentInput = InferRequestType<
  (typeof rpc.environments)[":id"]["$patch"]
>["json"] & { environmentId: string; projectId: string }

/**
 * Rename an environment. Safe upstream: variable references resolve by service
 * name, so nothing pointing at this environment breaks.
 */
function useRenameEnvironment() {
  const queryClient = useQueryClient()

  return useMutation({
    // `name` is picked rather than rest-spread: `projectId` is for invalidation
    // only, and the route rejects a body carrying anything else.
    mutationFn: ({ environmentId, name }: RenameEnvironmentInput) =>
      unwrap(
        rpc.environments[":id"].$patch({
          param: { id: environmentId },
          json: { name },
        })
      ),
    onSuccess: (_data, { projectId }) => invalidate(queryClient, projectId),
  })
}

type DeleteEnvironmentInput = {
  environmentId: string
  projectId: string
}

/**
 * Delete an environment and everything deployed in it. Irreversible.
 *
 * The server refuses two cases outright — the project's primary environment,
 * and its last remaining one — and answers 400 either way. The UI hides the
 * control in both, so reaching that error means the list was stale.
 *
 * The environment's own cache entries are dropped rather than invalidated:
 * nothing is left to refetch, and the page reading it would only chase a 404.
 */
function useDeleteEnvironment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ environmentId, projectId }: DeleteEnvironmentInput) =>
      unwrap(
        rpc.environments[":id"].$delete({
          param: { id: environmentId },
          query: { projectId },
        })
      ),
    onSuccess: (_data, { environmentId, projectId }) => {
      queryClient.removeQueries({
        queryKey: queryKeys.environments.byId(environmentId),
      })
      invalidate(queryClient, projectId)
    },
  })
}

/** What these mutations drop: the overview's environment list, and every
 * environment's own cached services. */
function invalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.projects.byId(projectId),
  })
  queryClient.invalidateQueries({ queryKey: queryKeys.environments.all() })
}

export {
  environmentQueryOptions,
  useEnvironmentServices,
  useCreateEnvironment,
  useRenameEnvironment,
  useDeleteEnvironment,
}
export type {
  EnvironmentDetail,
  CreateEnvironmentInput,
  RenameEnvironmentInput,
  DeleteEnvironmentInput,
}
