import { RequireSession } from "@/components/auth/require-session"

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireSession>
      {/* Full-bleed, unlike the dashboard shell: the canvas is the page, so it
          gets the whole viewport and scrolls inside itself. */}
      <div className="flex h-svh flex-col overflow-hidden">
        <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </RequireSession>
  )
}
