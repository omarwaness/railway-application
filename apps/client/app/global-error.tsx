"use client"

import { useEffect } from "react"

/**
 * The last resort: this fires only when the root layout itself throws, which
 * means `error.tsx` never mounted and neither did `ThemeProvider` or the fonts.
 *
 * That's why it ships its own `<html>` and `<body>` — it replaces the root
 * layout rather than rendering inside it — and why the styling is inline
 * instead of Tailwind classes. `globals.css` is imported by the layout that
 * just failed, so no stylesheet is guaranteed to be present.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100svh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "0 1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 500 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: "0.875rem", opacity: 0.7, maxWidth: "28rem" }}>
          The application failed to load.
          {error.digest ? ` Reference: ${error.digest}` : ""}
        </p>
        <button
          onClick={reset}
          style={{
            border: "1px solid currentColor",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
