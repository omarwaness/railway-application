import { createAuthClient } from "better-auth/react"

// Same public URL the RPC client uses — better-auth appends its own
// `/api/auth` base path, which is where the server mounts the handler.
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL

if (!serverUrl) {
  throw new Error("NEXT_PUBLIC_SERVER_URL is not set")
}

/**
 * Browser-side auth. This runs in the browser on purpose: the session cookie
 * is set by the API's `Set-Cookie`, which only reaches the right cookie jar
 * when the request comes from the browser — a server action would receive it
 * on the Next server instead. Social sign-in also needs a real browser
 * redirect to the provider.
 *
 * Cross-origin credentials are on by default in better-auth's client, so the
 * cookie rides along the same way `credentials: "include"` does for the RPC.
 */
export const authClient = createAuthClient({
  baseURL: serverUrl,
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient

export type Session = typeof authClient.$Infer.Session
export type SessionUser = Session["user"]
