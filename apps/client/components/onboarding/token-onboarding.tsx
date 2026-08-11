"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { tokenQueryOptions, useSaveToken } from "@/lib/api/token"
import { RAILWAY_LOGIN, RAILWAY_TOKENS } from "@/lib/railway"
import { redirectTarget } from "@/lib/redirects"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/** Where a finished — or skipped — onboarding lands when nothing else asked. */
const DEFAULT_TARGET = "/dashboard"

const steps = [
  {
    title: "Sign in to Railway",
    body: (
      <>
        The account whose projects you want to see here.{" "}
        <a href={RAILWAY_LOGIN} target="_blank" rel="noreferrer noopener">
          railway.com/login
        </a>
      </>
    ),
  },
  {
    title: "Open Account Settings → Tokens",
    body: (
      <>
        <a href={RAILWAY_TOKENS} target="_blank" rel="noreferrer noopener">
          railway.com/account/tokens
        </a>{" "}
        goes straight there.
      </>
    ),
  },
  {
    title: "Create a token",
    body: "Give it a name and pick the workspace it should reach. A token with no workspace only sees your personal projects.",
  },
  {
    title: "Copy it and paste it above",
    body: "Railway shows the value once, at that moment. It's encrypted before it's stored here, and never shown again.",
  },
]

function TokenOnboarding() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const saveToken = useSaveToken()

  // Whether there's already a token. An error here isn't one: it means the
  // status couldn't be read, not that nothing is saved, and the form is the
  // more useful thing to show either way.
  const { data: status, isPending } = useQuery(tokenQueryOptions())
  const hasToken = Boolean(status && "last4" in status)

  const value = token.trim()

  function leave() {
    router.replace(redirectTarget(DEFAULT_TARGET))
  }

  // Nothing to onboard: an account that already has a token — one saved from
  // settings, or a second visit to this URL — goes where it was headed.
  useEffect(() => {
    if (hasToken) {
      router.replace(redirectTarget(DEFAULT_TARGET))
    }
  }, [hasToken, router])

  /**
   * Guarded here rather than at each caller: a paste can land while an earlier
   * one is still in flight, and the button is only one of the two ways in.
   */
  function save(next: string) {
    const trimmed = next.trim()

    if (!trimmed || saveToken.isPending) {
      return
    }

    saveToken.mutate(
      { token: trimmed },
      {
        onSuccess: (result) => {
          leave()
          toast.add({
            type: "success",
            title: "Token saved",
            description: `Ending in ${result.last4}`,
          })
        },
        // Stays put on failure so a mistyped token can be corrected.
        onError: (error) =>
          toast.add({
            type: "error",
            title: "Could not save token",
            description: error.message,
          }),
      }
    )
  }

  /**
   * Saves what the paste is about to produce, rather than what's in the field
   * now — the input's own value updates a tick later, and Railway shows the
   * token once, so the paste is the moment to catch it.
   */
  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text")

    if (!pasted.trim()) {
      return
    }

    const { selectionStart, selectionEnd } = event.currentTarget

    save(
      token.slice(0, selectionStart ?? token.length) +
        pasted +
        token.slice(selectionEnd ?? token.length)
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    save(token)
  }

  // Covers the redirect too, so the prompt never flashes up at someone who
  // isn't being asked anything.
  if (isPending || hasToken) {
    return (
      <div aria-busy className="flex min-h-svh items-center justify-center">
        <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold">
            Connect your Railway account
          </h1>
          <p className="text-muted-foreground">
            Your projects, services, deployments and logs are all read through
            your own Railway API token. Paste one to fill this app with them.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <Input
              id="railway-token"
              name="token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              onPaste={handlePaste}
              placeholder="Paste your Railway API token"
              maxLength={500}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
              className="h-10 font-mono"
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!value || saveToken.isPending}
          >
            {saveToken.isPending && <Spinner />}
            Save and continue
          </Button>
        </form>

        <Steps />

        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={leave}>
            Skip for now
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * How to get the token, as a numbered spine: each step's circle is joined to
 * the next by the line the column stretches to fill, so the run reads as one
 * sequence rather than four separate notes.
 */
function Steps() {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1

        return (
          <li key={step.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-xs font-medium text-primary"
              >
                {index + 1}
              </span>

              {/* The connector: `flex-1` against a stretched column, so it
                  spans whatever height the step's text turns out to be. */}
              {!isLast && (
                <span aria-hidden className="w-px flex-1 bg-border" />
              )}
            </div>

            <div
              className={cn("flex flex-col gap-1 pt-0.5", !isLast && "pb-6")}
            >
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-sm text-muted-foreground *:[a]:text-foreground *:[a]:underline *:[a]:underline-offset-3">
                {step.body}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { TokenOnboarding }
