import { RequireSession } from "@/components/auth/require-session"
import { Navbar } from "@/components/dashboard/navbar"

/**
 * The shell every signed-in route renders into.
 *
 * `(dashboard)` is a route group: it gives these pages a shared layout without
 * putting a segment in their URLs, which is how `/settings` sits next to
 * `/dashboard` at the top level and still gets this navbar.
 *
 * `RequireSession` lives here rather than in each page, so a new route in the
 * group is protected by existing — there's no per-page step to forget.
 * `proxy.ts` still handles the hard load; this covers the stale cookie.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireSession>
      {/* `overflow-hidden` because the shell is already exactly one viewport
          tall: anything that would push past it is a pane that should be
          scrolling inside itself, never the document. */}
      <div className="flex h-svh flex-col overflow-hidden">
        <Navbar />
        <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-auto px-4 py-6">
          {children}
        </main>
      </div>
    </RequireSession>
  )
}
