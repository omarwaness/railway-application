import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

import { REDIRECT_PARAM } from "@/lib/redirects"

const LOGIN_PATH = "/auth/login"

/**
 * Next 16's replacement for `middleware.ts` — same entry point, new filename.
 *
 * This is an *optimistic* gate, not an authorization check. It asks one
 * question — is there a session cookie — and never validates it, because
 * validating would mean a cross-origin round trip to the API on every
 * navigation. A cookie that is expired or revoked still passes here.
 *
 * That's fine, because nothing is actually protected by this file. The API
 * rejects unauthenticated requests on its own (`authMiddleware`), and the Next
 * app holds no data of its own. What this buys is the user experience: an
 * unauthenticated visitor lands on the login page instead of watching a shell
 * render and then fill up with 401s.
 *
 * `RequireSession` covers the case this can't see — cookie present, session no
 * longer valid.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // `/auth/*` has to stay reachable without a session, or there'd be nowhere
  // to log in.
  if (pathname.startsWith("/auth")) {
    return NextResponse.next()
  }

  // Reads the cookie by name only. `getSessionCookie` knows about the
  // `__Secure-` prefix better-auth adds in production, which a hand-rolled
  // `request.cookies.get()` would miss.
  if (getSessionCookie(request)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = LOGIN_PATH
  // Wipe the incoming query before adding ours, so parameters from the blocked
  // page don't ride along to the login form.
  url.search = ""
  url.searchParams.set(REDIRECT_PARAM, `${pathname}${search}`)

  return NextResponse.redirect(url)
}

/**
 * Note what's missing: there's no rule sending signed-in users away from
 * `/auth/*`. It would read well, but combined with `RequireSession` it forms a
 * loop — a stale cookie passes the check here, gets bounced off the login page
 * to `/`, and is sent straight back by the client-side guard that can see the
 * session is dead. Letting a signed-in visitor open the login page is harmless
 * by comparison.
 */
export const config = {
  // Everything except Next's own assets and static files. `_next/data` is left
  // in on purpose: a client-side navigation to a protected route should be
  // redirected the same way a hard load is.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
