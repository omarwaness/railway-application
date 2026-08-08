import { queryOptions } from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/keys"
import { authClient, type Session } from "@/lib/auth-client"

/**
 * The current session, or `null` when nobody is signed in.
 *
 * Signed-out is a result, not a failure — better-auth answers with `data: null`
 * and no error, so this never throws on the common case and the caller can
 * branch on the value instead of on `isError`.
 *
 * Shared options rather than a hook so the same key, fetcher and freshness back
 * every call site; anything that changes the session invalidates
 * `queryKeys.session.all()`.
 */
function sessionQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.session.all(),
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await authClient.getSession()

      if (error) {
        throw new Error(error.message ?? "Could not load your session")
      }

      return data
    },
    // The cookie outlives any single page, and every mutation that touches it
    // invalidates this key — so there's nothing to gain from refetching on a
    // routine remount.
    staleTime: 5 * 60 * 1000,
  })
}

export { sessionQueryOptions }
