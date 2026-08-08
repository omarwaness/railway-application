"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { sessionQueryOptions } from "@/lib/api/session"
import { REDIRECT_PARAM } from "@/lib/redirects"

/**
 * The half of route protection `proxy.ts` can't do.
 *
 * The proxy only sees whether a session cookie exists; a cookie that expired,
 * or a session revoked from another device, sails past it. This validates for
 * real — through the same cached query the rest of the app reads, so on a warm
 * cache it costs nothing — and sends the user to log in when it comes back
 * empty.
 *
 * Children are server components as far as this is concerned: it takes them as
 * `children` and gates rendering, so wrapping a page here doesn't push it into
 * the client bundle.
 */
function RequireSession({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, isPending } = useQuery(sessionQueryOptions())

  const signedOut = !isPending && !session

  useEffect(() => {
    if (!signedOut) {
      return
    }

    const target = `/auth/login?${REDIRECT_PARAM}=${encodeURIComponent(pathname)}`

    // `replace`, not `push` — a rejected page shouldn't sit in history for the
    // back button to bounce off after logging in.
    router.replace(target)
  }, [signedOut, pathname, router])

  // Also covers the moment between deciding to redirect and the navigation
  // landing, so the protected page never renders for a signed-out visitor.
  if (isPending || signedOut) {
    return (
      <div aria-busy className="flex min-h-svh items-center justify-center">
        <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}

export { RequireSession }
