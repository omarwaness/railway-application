import Link from "next/link"

import { CurrentUser } from "@/components/auth/current-user"
import { RequireSession } from "@/components/auth/require-session"
import { buttonVariants } from "@/components/ui/button"

/**
 * A route with nothing on it but the protection itself — somewhere to confirm
 * both layers work before there's a real dashboard to break.
 *
 * `proxy.ts` covers the hard load (no cookie, never renders), `RequireSession`
 * covers the cookie that's present but no longer valid.
 */
export default function Page() {
  return (
    <RequireSession>
      <div className="flex min-h-svh flex-col items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Protected route</h1>
            <p className="text-sm text-muted-foreground">
              You only see this with a valid session. Signed out, a request for
              this path is redirected to the login page before it renders — and
              logging in brings you back here rather than to the home page.
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <CurrentUser />
          </div>

          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Back home
          </Link>
        </div>
      </div>
    </RequireSession>
  )
}
