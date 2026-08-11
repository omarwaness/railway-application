import { isSectionId } from "@/components/settings/sections"
import { UserSettings } from "@/components/settings/user-settings"

/**
 * Protected by sitting under `app/(dashboard)` — the layout's `RequireSession`
 * wraps it, and `proxy.ts` redirects a cookie-less hard load before it renders.
 *
 * `?section=` is what the dashboard's missing-token notice points at. Read here
 * rather than with `useSearchParams` so the rail opens on the right section in
 * the first render, with no flash of the default one; reading it is what makes
 * this route render on demand.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>
}) {
  const { section } = await searchParams

  return (
    <UserSettings initialSection={isSectionId(section) ? section : undefined} />
  )
}
