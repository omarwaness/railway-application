/**
 * Protected by sitting under `app/(dashboard)` — the layout's `RequireSession`
 * wraps it, and `proxy.ts` redirects a cookie-less hard load before it renders.
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground">
        Nothing to configure yet.
      </p>
    </div>
  )
}
