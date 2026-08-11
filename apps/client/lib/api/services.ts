import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { queryKeys, type EnvironmentScope } from "@/lib/api/keys"
import {
  rpc,
  unwrap,
  type InferRequestType,
  type InferResponseType,
} from "@/lib/rpc"

/**
 * How a service is configured in one environment: where it's built from, where
 * it runs, and what it runs. A service has no single configuration — the same
 * service is set up separately per environment, which is why this is keyed on
 * both ids.
 */
type ServiceInstance = NonNullable<
  InferResponseType<(typeof rpc.services)[":id"]["instance"]["$get"], 200>
>["instance"]

function serviceInstanceQueryOptions(
  serviceId: string,
  { environmentId }: EnvironmentScope
) {
  return queryOptions({
    queryKey: queryKeys.services.instance(serviceId, { environmentId }),
    queryFn: () =>
      unwrap(
        rpc.services[":id"].instance.$get({
          param: { id: serviceId },
          query: { environmentId },
        })
      ),
  })
}

type CreateServiceInput = InferRequestType<typeof rpc.services.$post>["json"]

/**
 * Create a service. Only `projectId` is required — Railway names the service
 * when `name` is omitted, and a service with no source is created empty.
 *
 * Three things go stale on success: the project overview, whose environment
 * carries the service list the canvas draws; the dashboard lists, which flatten
 * each project's services; and the environments cache, which is where the
 * service list comes from once the switcher has moved off the primary
 * environment. `projects.byId` is a prefix, so the overview is invalidated
 * whatever detail params it was fetched with.
 */
function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateServiceInput) =>
      unwrap(rpc.services.$post({ json: input })),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.byId(projectId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.environments.all() })
    },
  })
}

/** `projectId` isn't sent — the route keys off the service alone, and it's here
 * only so the overview it belongs to can be invalidated. */
type DeleteServiceInput = {
  serviceId: string
  projectId: string
}

/**
 * Delete a service in every environment at once. Irreversible upstream: the
 * deployments, variables and domains go with it.
 *
 * The same three caches as create go stale, plus everything cached under the
 * service itself — `services.byId` is a prefix, so its identity, instance and
 * detail entries are dropped together rather than left to refetch a 404.
 */
function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ serviceId }: DeleteServiceInput) =>
      unwrap(rpc.services[":id"].$delete({ param: { id: serviceId } })),
    onSuccess: (_data, { projectId, serviceId }) => {
      queryClient.removeQueries({
        queryKey: queryKeys.services.byId(serviceId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.byId(projectId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      // The overview only carries the primary environment's services; every
      // other one is cached under `environments`, and this removes the service
      // from all of them at once.
      queryClient.invalidateQueries({ queryKey: queryKeys.environments.all() })
    },
  })
}

export { serviceInstanceQueryOptions, useCreateService, useDeleteService }
export type { ServiceInstance, CreateServiceInput, DeleteServiceInput }
