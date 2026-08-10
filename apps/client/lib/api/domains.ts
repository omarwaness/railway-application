import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { queryKeys, type DomainScope } from "@/lib/api/keys"
import { rpc, unwrap, type InferRequestType } from "@/lib/rpc"

/**
 * Every domain pointing at one service in one environment, in two lists:
 * `serviceDomains` are the ones Railway generates, `customDomains` are the ones
 * the user brought.
 *
 * This is the only place a service's public URL lives — neither `Service` nor
 * `ServiceInstance` carries it, and the `staticUrl` on a deployment is a
 * snapshot of what was true when that deployment went out.
 */
function serviceDomainsQueryOptions(scope: DomainScope) {
  return queryOptions({
    queryKey: queryKeys.domains.list(scope),
    queryFn: () => unwrap(rpc.domains.$get({ query: scope })),
  })
}

type CreateServiceDomainInput = InferRequestType<
  typeof rpc.domains.service.$post
>["json"]

/**
 * Generate a Railway domain for a service. The name is assigned upstream —
 * there's nothing to ask for, which is why this is a button and not a form.
 * Leaving `targetPort` out lets Railway infer the port from the service.
 *
 * It comes back CREATING rather than ACTIVE, so the domain appears in the list
 * before it resolves.
 *
 * Invalidation is the whole `domains` list prefix rather than this one scope —
 * cheap, and only the list the open panel is observing refetches right away.
 */
function useCreateServiceDomain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateServiceDomainInput) =>
      unwrap(rpc.domains.service.$post({ json: input })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.lists() }),
  })
}

/** Which of the two lists a domain came from — they delete through different
 * routes, and the merged list is the only place that distinction survives. */
type DomainKind = "service" | "custom"

type DeleteDomainInput = {
  id: string
  kind: DomainKind
}

/**
 * Remove a domain. One hook for both kinds because the call site has one
 * button: the route is picked from where the domain came from.
 *
 * Deleting a custom domain only detaches it from Railway — the user's own DNS
 * records still point here until they clear them.
 */
function useDeleteDomain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, kind }: DeleteDomainInput) =>
      kind === "custom"
        ? unwrap(rpc.domains.custom[":id"].$delete({ param: { id } }))
        : unwrap(rpc.domains.service[":id"].$delete({ param: { id } })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.lists() }),
  })
}

export { serviceDomainsQueryOptions, useCreateServiceDomain, useDeleteDomain }
export type {
  DomainScope,
  DomainKind,
  CreateServiceDomainInput,
  DeleteDomainInput,
}
