"use client"

import { useEffect } from "react"
import { RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Catches render and data-fetching errors thrown anywhere below the root
 * layout. Without it, a production build shows Next's own unstyled error page
 * — and, because production builds strip error messages from the client, one
 * that says nothing useful.
 *
 * The layout still renders around this, so the theme and fonts survive.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The only channel that carries anything diagnostic: React replaces the
    // message with a generic string in production builds, but `digest` matches
    // an entry in the server logs where the real stack was written.
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          The page failed to load. Trying again is usually enough — if it
          isn&apos;t, the error has been logged.
        </p>
      </div>

      {/* Identifies this exact failure in the server logs, so it's worth
          showing rather than hiding — it's the one thing a user can quote. */}
      {error.digest && (
        <code className="text-muted-foreground font-mono text-xs">
          {error.digest}
        </code>
      )}

      <Button onClick={reset} variant="outline">
        <RotateCw />
        Try again
      </Button>
    </div>
  )
}
