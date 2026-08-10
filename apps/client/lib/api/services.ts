import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/keys"
import { rpc, unwrap, type InferRequestType } from "@/lib/rpc"

type CreateServiceInput = InferRequestType<typeof rpc.services.$post>["json"]

/**
 * Create a service. Only `projectId` is required — Railway names the service
 * when `name` is omitted, and a service with no source is created empty.
 *
 * Two things go stale on success: the project overview, whose environment
 * carries the service list the canvas draws, and the dashboard lists, which
 * flatten each project's services. `projects.byId` is a prefix, so the overview
 * is invalidated whatever detail params it was fetched with.
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
    },
  })
}

export { useCreateService }
export type { CreateServiceInput }
