"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { sessionQueryOptions } from "@/lib/api/session"
import { LogoutButton } from "@/components/auth/logout-button"
import { buttonVariants } from "@/components/ui/button"

/**
 * Who's signed in, read through TanStack Query rather than better-auth's
 * `useSession` so it shares a cache with the rest of the app: sign-in, sign-up
 * and sign-out all invalidate `queryKeys.session.all()`, and this re-reads
 * without any of them knowing it exists.
 */
function CurrentUser() {
  const { data: session, isPending, error } = useQuery(sessionQueryOptions())

  if (isPending) {
    return (
      <div aria-busy className="h-9 w-48 animate-pulse rounded-md bg-muted" />
    )
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error.message}
      </p>
    )
  }

  // `null` is the signed-out answer, not a failure — the query resolves
  // normally and there is simply no user to show.
  if (!session) {
    return (
      <Link href="/auth/login" className={buttonVariants({ size: "default" })}>
        Log in
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 text-sm leading-tight">
        <p className="truncate font-medium">{session.user.name}</p>
        <p className="truncate text-muted-foreground">{session.user.email}</p>
      </div>
      <LogoutButton />
    </div>
  )
}

export { CurrentUser }
