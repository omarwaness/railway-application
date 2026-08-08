/**
 * The query parameter carrying "where the user was headed before we asked them
 * to log in". Shared so the proxy that writes it and the forms that read it
 * can't drift apart.
 */
const REDIRECT_PARAM = "redirect"

/**
 * Narrows a `?redirect=` value to a same-site path.
 *
 * The parameter is attacker-controllable — anyone can hand out a link with
 * `?redirect=https://evil.example` — so following it unchecked after a
 * successful login would turn the login page into an open redirect wearing our
 * domain. Only a path rooted at `/` is allowed through:
 *
 *   `//evil.example`  is protocol-relative and resolves to another host
 *   `/\evil.example`  is normalized to `//` by browsers, same problem
 */
function safeRedirectPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/")) {
    return fallback
  }

  if (value.startsWith("//") || value.startsWith("/\\")) {
    return fallback
  }

  return value
}

/**
 * Where to send the user after they authenticate, read from the URL at the
 * moment it's needed. Deliberately not `useSearchParams` — reading it in an
 * event handler keeps the auth pages statically renderable, which the hook
 * would force us to wrap in a Suspense boundary.
 */
function redirectTarget(fallback = "/") {
  const value = new URLSearchParams(window.location.search).get(REDIRECT_PARAM)

  return safeRedirectPath(value, fallback)
}

export { REDIRECT_PARAM, safeRedirectPath, redirectTarget }
