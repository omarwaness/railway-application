import { QueryClient, isServer } from "@tanstack/react-query"

/**
 * Deliberately not a `"use client"` module. Server components import
 * `getQueryClient` directly — from a client module they'd get a client
 * reference they can't call during a server render.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Long enough that a render pass triggered by navigation reuses the
        // cache instead of refetching, short enough that deployment and
        // build state stay close to live. Volatile resources override this.
        staleTime: 30 * 1000,
        // A 401 or a validation error won't fix itself on a retry — only
        // retry what could plausibly be transient.
        retry: (failureCount, error) => {
          const status = (error as { status?: number }).status
          if (status && status >= 400 && status < 500) {
            return false
          }
          return failureCount < 2
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/**
 * A fresh client per server render keeps one request's data from leaking into
 * another's; the browser keeps a single client so the cache survives
 * re-renders and suspense.
 */
function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }

  browserQueryClient ??= makeQueryClient()

  return browserQueryClient
}

export { getQueryClient, makeQueryClient }
