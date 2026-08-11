import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  queryKeys,
  type ProjectFilters,
  type ProjectDetailParams,
} from "@/lib/api/keys"
import {
  rpc,
  unwrap,
  type InferRequestType,
  type InferResponseType,
} from "@/lib/rpc"

/**
 * One project as the list route returns it — services flattened and all.
 * Derived from the route rather than hand-written, so a field that changes
 * shape upstream breaks the components reading it.
 */
type Project = InferResponseType<
  typeof rpc.projects.$get,
  200
>["projects"][number]

type ProjectService = Project["services"][number]

/**
 * The caller's projects, plus the workspaces the token can see — the API
 * batches both into one response so the dashboard paints from a single request.
 *
 * Filters stay typed here (`first` a number, `orderBy` a union) and are widened
 * to strings on the way out, because a query string has nothing else to carry;
 * the server coerces them back. Undefined entries are dropped rather than sent
 * as "undefined".
 */
function projectsQueryOptions(filters: ProjectFilters = {}) {
  const { workspaceId, first, after, orderBy } = filters

  return queryOptions({
    // The unwidened filters, so the cache key reads the way the caller wrote it.
    queryKey: queryKeys.projects.list(filters),
    queryFn: () =>
      unwrap(
        rpc.projects.$get({
          query: {
            ...(workspaceId !== undefined && { workspaceId }),
            ...(first !== undefined && { first: String(first) }),
            ...(after !== undefined && { after }),
            ...(orderBy !== undefined && { orderBy }),
          },
        })
      ),
  })
}

/**
 * Everything the project page opens with: the project itself, its environments
 * for the switcher, and the services in whichever environment is primary.
 */
type ProjectOverview = InferResponseType<
  (typeof rpc.projects)[":id"]["$get"],
  200
>

/**
 * A service as the overview returns it: the service itself plus the instance
 * fields that belong to the environment being shown, latest deployment included.
 * Not the same shape as `ProjectService` — that one comes off the list route.
 */
type EnvironmentService = NonNullable<
  ProjectOverview["primaryEnvironment"]
>["services"][number]

/**
 * One project by id. Same widening as the list — `envFirst` and `isEphemeral`
 * go out as strings and the server coerces them back — and the key keeps the
 * params as written, so `queryKeys.projects.byId(id)` invalidates every
 * variation at once.
 */
function projectOverviewQueryOptions(
  projectId: string,
  params: ProjectDetailParams = {}
) {
  const { envFirst, isEphemeral } = params

  return queryOptions({
    queryKey: queryKeys.projects.detail(projectId, params),
    queryFn: () =>
      unwrap(
        rpc.projects[":id"].$get({
          param: { id: projectId },
          query: {
            ...(envFirst !== undefined && { envFirst: String(envFirst) }),
            ...(isEphemeral !== undefined && {
              isEphemeral: String(isEphemeral),
            }),
          },
        })
      ),
  })
}

type CreateProjectInput = InferRequestType<typeof rpc.projects.$post>["json"]

/**
 * Create a project. Every field is optional — `{}` gets a Railway-generated
 * name — and success invalidates every projects list, whatever its filters.
 */
function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      unwrap(rpc.projects.$post({ json: input })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() }),
  })
}

type UpdateProjectInput = InferRequestType<
  (typeof rpc.projects)[":id"]["$patch"]
>["json"] & { projectId: string }

/**
 * Update a project. Only the fields in the body change — Railway ignores nulls,
 * so `description: ""` is how you clear one.
 *
 * Both caches carry the name: the overview the project page reads, and the
 * dashboard lists. `projects.byId` is a prefix, so the overview is invalidated
 * whatever detail params it was fetched with.
 */
function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, ...input }: UpdateProjectInput) =>
      unwrap(
        rpc.projects[":id"].$patch({ param: { id: projectId }, json: input })
      ),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.byId(projectId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
    },
  })
}

/**
 * Delete a project. Irreversible upstream — every environment, service and
 * volume goes with it.
 *
 * The project's own cache entries are dropped rather than invalidated: nothing
 * is left to refetch, and leaving them would send the page it belongs to after
 * a 404.
 */
function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) =>
      unwrap(rpc.projects[":id"].$delete({ param: { id: projectId } })),
    onSuccess: (_data, projectId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.projects.byId(projectId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
    },
  })
}

export {
  projectsQueryOptions,
  projectOverviewQueryOptions,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
}
export type {
  Project,
  ProjectService,
  ProjectOverview,
  EnvironmentService,
  CreateProjectInput,
  UpdateProjectInput,
}
