"use client"

import { useState } from "react"
import Image from "next/image"
import { LoaderCircleIcon } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { redirectTarget } from "@/lib/redirects"
import { Button } from "@/components/ui/button"

function LoginGithub() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signInWithGithub() {
    setError(null)
    setPending(true)

    const { error } = await authClient.signIn.social({
      provider: "github",
      // Absolute URL on purpose: the API sits on its own origin, so a relative
      // path would be resolved against the API and land the user there instead
      // of back in the app. `CLIENT_URL` is a trusted origin server-side.
      //
      // The path is read here rather than passed in, so a provider round trip
      // ends on the page the proxy originally blocked, or the dashboard.
      callbackURL: `${window.location.origin}${redirectTarget("/dashboard")}`,
    })

    // Only reached when the call fails — a success hands the browser to GitHub
    // and this component unmounts with the page, so `pending` stays on until
    // the redirect takes over.
    if (error) {
      setError(error.message ?? "Could not continue with GitHub.")
      setPending(false)
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        variant="secondary"
        size="lg"
        disabled={pending}
        onClick={signInWithGithub}
      >
        {pending ? (
          <LoaderCircleIcon className="size-5 animate-spin" />
        ) : (
          <Image
            src="/github.svg"
            alt=""
            width={20}
            height={20}
            className="size-5 dark:invert"
          />
        )}
        Continue with GitHub
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export { LoginGithub }
