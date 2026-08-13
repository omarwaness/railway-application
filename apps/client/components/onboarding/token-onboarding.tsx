"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { tokenQueryOptions, useSaveToken } from "@/lib/api/token"
import { EASE_OUT, SPRING_PANEL } from "@/lib/ease"
import { RAILWAY_LOGIN, RAILWAY_TOKENS } from "@/lib/railway"
import { redirectTarget } from "@/lib/redirects"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/** Where a finished — or skipped — onboarding lands when nothing else asked. */
const DEFAULT_TARGET = "/dashboard"

/** How long the confirmation holds before it sends the user on, in ms. */
const SUCCESS_DELAY = 5000

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
  // The last four of a token saved in this visit — the flag that swaps the
  // form out for the confirmation, and what it names the token by.
  const [savedLast4, setSavedLast4] = useState<string | null>(null)
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
  //
  // Held off once this visit saved one: the save flips `hasToken` as soon as
  // the refetch lands, which would otherwise cut the confirmation short.
  useEffect(() => {
    if (hasToken && !savedLast4) {
      router.replace(redirectTarget(DEFAULT_TARGET))
    }
  }, [hasToken, savedLast4, router])

  // The confirmation's own timer. Cleared on unmount, so pressing Continue
  // doesn't leave a second navigation queued behind the first.
  useEffect(() => {
    if (!savedLast4) {
      return
    }

    const timer = window.setTimeout(
      () => router.replace(redirectTarget(DEFAULT_TARGET)),
      SUCCESS_DELAY
    )

    return () => window.clearTimeout(timer)
  }, [savedLast4, router])

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
        // No toast: the confirmation screen carries the same news, and a toast
        // would follow the user to the dashboard to repeat it.
        onSuccess: (result) => setSavedLast4(result.last4),
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

  // Ahead of the check below: saving flips `hasToken`, and the spinner would
  // otherwise take the confirmation's place halfway through it.
  if (savedLast4) {
    return <TokenSaved last4={savedLast4} onContinue={leave} />
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
 * Where a saved token lands: the mark, what was saved, and the two ways on —
 * the button, or the parent's timer, which the rail counts down.
 */
function TokenSaved({
  last4,
  onContinue,
}: {
  last4: string
  onContinue: () => void
}) {
  const reduce = useReducedMotion()

  return (
    <div
      role="status"
      className="flex min-h-svh flex-col items-center justify-center p-6"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <motion.div
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_PANEL}
          className="relative flex size-24 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-success/25"
        >
          {/* One ripple out of the disc as it settles. Purely decorative, so
              it's dropped rather than shortened when movement is unwelcome. */}
          {!reduce && (
            <motion.span
              aria-hidden
              initial={{ scale: 0.9, opacity: 0.4 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }}
              className="absolute inset-0 rounded-full bg-success"
            />
          )}

          {/* Drawn rather than dropped in: animating `pathLength` runs the
              stroke on from its start, so the tick reads as being ticked. */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative size-11"
          >
            <motion.path
              d="M20 6 9 17l-5-5"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.15 }}
            />
          </svg>
        </motion.div>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold">
            You&apos;re all set
          </h1>
          <p className="text-muted-foreground">
            Your token is encrypted and saved. Your projects, services and
            deployments are ready to read.
          </p>
          <p className="font-mono text-sm text-muted-foreground">
            Token ending in {last4}
          </p>
        </div>

        <Button size="lg" className="w-full" onClick={onContinue}>
          Continue to dashboard
          <ArrowRightIcon data-icon="inline-end" />
        </Button>

        {/* A meter, not an ornament — it's the only sign that something is
            about to happen on its own, so it runs whatever the motion
            preference, at the timer's own pace. */}
        <div className="flex w-full flex-col items-center gap-2">
          <div
            aria-hidden
            className="h-0.5 w-full overflow-hidden rounded-full bg-border"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: SUCCESS_DELAY / 1000, ease: "linear" }}
              style={{ originX: 0 }}
              className="h-full bg-success"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Taking you to your dashboard…
          </p>
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
