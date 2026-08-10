import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { queryKeys, type VariableParams } from "@/lib/api/keys"
import { rpc, unwrap, type InferRequestType } from "@/lib/rpc"

/** Which service's own variables to read — never the environment's shared ones. */
type ServiceVariableScope = {
  projectId: string
  environmentId: string
  serviceId: string
}

/**
 * A service's own variables, as a flat name→value map — there are no ids
 * upstream, so the name is the identity.
 *
 * Read unrendered: `${{Postgres.DATABASE_URL}}` comes back verbatim rather than
 * resolved, which is what an editor needs. Saving a rendered value back would
 * bake the reference into a literal.
 */
function serviceVariablesQueryOptions(scope: ServiceVariableScope) {
  const { projectId, environmentId, serviceId } = scope

  const params: VariableParams = {
    projectId,
    environmentId,
    scope: "service",
    serviceId,
    unrendered: true,
  }

  return queryOptions({
    queryKey: queryKeys.variables.list(params),
    queryFn: () =>
      unwrap(
        rpc.variables.$get({
          query: {
            projectId,
            environmentId,
            scope: "service",
            serviceId,
            unrendered: "true",
          },
        })
      ),
  })
}

type UpsertVariableInput = InferRequestType<typeof rpc.variables.$put>["json"]

/**
 * Create or overwrite one variable, keyed by name — there is no separate
 * create upstream.
 *
 * Every write redeploys the affected service unless `skipDeploys` is set, which
 * is what makes the new value actually take effect.
 *
 * Invalidation is the whole `variables` list prefix rather than this one scope:
 * the same variables can be cached rendered and unrendered, and only the query
 * the open drawer is observing refetches right away.
 */
function useUpsertVariable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpsertVariableInput) =>
      unwrap(rpc.variables.$put({ json: input })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.variables.lists() }),
  })
}

type DeleteVariableInput = InferRequestType<
  typeof rpc.variables.$delete
>["query"]

/**
 * Delete one variable by name. Unlike the upsert there's no `skipDeploys`
 * upstream, so a delete always redeploys the service.
 */
function useDeleteVariable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DeleteVariableInput) =>
      unwrap(rpc.variables.$delete({ query: input })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.variables.lists() }),
  })
}

export { serviceVariablesQueryOptions, useUpsertVariable, useDeleteVariable }
export type { ServiceVariableScope, UpsertVariableInput, DeleteVariableInput }
