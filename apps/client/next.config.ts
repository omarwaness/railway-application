import type { NextConfig } from "next"

/**
 * Applied to every response. These are the headers a browser can't infer and
 * that Next doesn't send on its own.
 *
 * No Content-Security-Policy here on purpose: Next's inline hydration scripts
 * need either 'unsafe-inline' — which gives up most of what CSP is for — or a
 * per-request nonce, which can't be expressed in a static header list. It's
 * worth adding via proxy.ts later; a wrong CSP breaks the app silently, so it
 * shouldn't be guessed at.
 */
const securityHeaders = [
  // The API is on another origin and receives the session cookie on every
  // call, so clickjacking this UI is a real path to acting as the user.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Full URLs leak project and service IDs in paths; same-origin keeps those
  // out of anything the browser sends to a third party.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Two years with preload is the submission requirement for hstspreload.org.
  // Railway terminates TLS ahead of the app, so this only ever reaches a
  // browser that already arrived over https.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

const nextConfig: NextConfig = {
  // Note: no `output: "standalone"`. Railway deploys the built workspace with
  // node_modules intact and starts it with `next start`, so the trimmed
  // standalone bundle would buy nothing and cost the usual monorepo footgun —
  // its server.js lands at .next/standalone/apps/client/, with `public/` and
  // `.next/static/` needing to be copied in by hand. Revisit only if this moves
  // to a hand-written Dockerfile.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
