import {
  queryOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/keys"
import {
  rpc,
  unwrap,
  type InferRequestType,
  type InferResponseType,
} from "@/lib/rpc"

/**
 * Whether this account has a Railway token, plus the last four characters when
 * it does.
 *
 * The full value never comes back — the server stores it encrypted and only
 * decrypts it to call Railway — so there is nothing to reveal in the UI, and
 * "editing" a token means replacing it with one the user pastes again.
 */
type TokenStatus = InferResponseType<typeof rpc.token.$get, 200>

function tokenQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.token.all(),
    queryFn: () => unwrap(rpc.token.$get()),
    // Only the two mutations below change it, and both invalidate this key.
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Everything except the session was fetched with the token that just changed,
 * so none of it describes what the new one can see — a workspace the old token
 * reached may not exist for this one at all.
 *
 * Removed rather than invalidated: an invalidated entry stays readable until
 * its refetch lands, which is exactly long enough to show another account's
 * projects.
 */
function dropRailwayData(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: ({ queryKey }) =>
      queryKey[0] !== "session" && queryKey[0] !== "token",
  })
}

type SaveTokenInput = InferRequestType<typeof rpc.token.$post>["json"]

/** Save a token, replacing whatever was stored before. */
function useSaveToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SaveTokenInput) =>
      unwrap(rpc.token.$post({ json: input })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.token.all() })
      dropRailwayData(queryClient)
    },
  })
}

/**
 * Remove the stored token. Nothing else is deleted — the account stays, and
 * saving a new token puts every Railway view back.
 */
function useDeleteToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => unwrap(rpc.token.$delete()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.token.all() })
      dropRailwayData(queryClient)
    },
  })
}

export { tokenQueryOptions, useSaveToken, useDeleteToken }
export type { TokenStatus, SaveTokenInput }
