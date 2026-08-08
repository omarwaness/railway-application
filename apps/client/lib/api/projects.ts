import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { queryKeys, type ProjectFilters } from "@/lib/api/keys"
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

export { projectsQueryOptions, useCreateProject }
export type { Project, ProjectService, CreateProjectInput }
