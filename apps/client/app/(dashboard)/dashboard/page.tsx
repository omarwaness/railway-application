import { ProjectsList } from "@/components/dashboard/projects-list"

/**
 * Protected by sitting under `app/(dashboard)` — the layout's `RequireSession`
 * wraps it, and `proxy.ts` redirects a cookie-less hard load before it renders.
 */
export default function Page() {
  return <ProjectsList />
}
