"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import type { VariantProps } from "class-variance-authority"

import { authClient } from "@/lib/auth-client"
import { Button, buttonVariants } from "@/components/ui/button"

// Borrowed straight from the button so the two stay in step: adding a variant
// there makes it callable here without touching this file.
type LogoutButtonProps = VariantProps<typeof buttonVariants>

function LogoutButton({
  variant = "outline",
  size = "default",
}: LogoutButtonProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)

    const { error } = await authClient.signOut()

    if (error) {
      setPending(false)
      return
    }

    // Everything in the cache was fetched as this user — the session, but also
    // their projects and deployments. Clearing beats invalidating: invalidated
    // entries stay readable until the refetch lands, so the next user would
    // briefly see the last one's data.
    queryClient.clear()

    router.push("/auth/login")
    // The session cookie is gone now, but any already-rendered server output
    // was built while it existed — this drops that cache so nothing from the
    // signed-in view survives the navigation.
    router.refresh()
  }

  return (
    <Button variant={variant} size={size} disabled={pending} onClick={logout}>
      {pending && <LoaderCircleIcon className="animate-spin" />}
      Log out
    </Button>
  )
}

export { LogoutButton }
