import { RequireSession } from "@/components/auth/require-session"

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireSession>
      <div className="flex h-svh flex-col overflow-hidden">
        <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-auto px-4 py-6">
          {children}
        </main>
      </div>
    </RequireSession>
  )
}
