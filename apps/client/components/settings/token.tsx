"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SquarePenIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"

import {
  tokenQueryOptions,
  useDeleteToken,
  useSaveToken,
  type TokenStatus,
} from "@/lib/api/token"
import { RAILWAY_LOGIN, RAILWAY_TOKENS } from "@/lib/railway"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { SectionHeader } from "@/components/settings/section-header"

type SavedToken = Extract<TokenStatus, { last4: string }>

/** The Railway API token every project view in this app is read through. */
function TokenSection() {
  const { data: status, isPending, error } = useQuery(tokenQueryOptions())

  const saved = status && "last4" in status ? status : null

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Token"
        description="The Railway API token this app uses on your behalf."
      />

      {isPending && <Skeleton aria-busy className="h-16 w-full" />}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}

      {status &&
        (saved ? (
          <SavedTokenPanel token={saved} />
        ) : (
          <div className="flex flex-col gap-6">
            <NoTokenAlert />
            <TokenForm />
          </div>
        ))}
    </section>
  )
}

function NoTokenAlert() {
  return (
    <Alert variant="warning">
      <TriangleAlertIcon />
      <AlertTitle>No token — nothing can load yet</AlertTitle>

      <AlertDescription>
        <p>
          This app talks to Railway entirely through your own API token. Until
          one is saved, your projects, services, deployments and logs all come
          back empty.
        </p>

        <ol className="list-decimal space-y-1.5 pl-4 marker:text-muted-foreground/70">
          <li>
            <a href={RAILWAY_LOGIN} target="_blank" rel="noreferrer noopener">
              Sign up or log in to Railway
            </a>{" "}
            — the account whose projects you want to see here.
          </li>
          <li>
            Open{" "}
            <a href={RAILWAY_TOKENS} target="_blank" rel="noreferrer noopener">
              Account Settings → Tokens
            </a>
            .
          </li>
          <li>
            Create a token: give it a name, and pick the workspace it should
            reach. A token with no workspace only sees your personal projects.
          </li>
          <li>Copy it — Railway shows the value once, at that moment.</li>
          <li>Paste it below and save.</li>
        </ol>
      </AlertDescription>
    </Alert>
  )
}

function SavedTokenPanel({ token }: { token: SavedToken }) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <TokenForm
        title="Replace token"
        submitLabel="Save"
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    )
  }

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldTitle>Railway token</FieldTitle>

        <div className="flex min-w-0 items-center gap-2 rounded-md border border-input bg-muted/50 py-1.5 pr-1.5 pl-2.5 dark:bg-muted/25">
          <span className="min-w-0 flex-1 truncate font-mono text-sm text-muted-foreground">
            {"•".repeat(20)}
            {token.last4}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => setIsEditing(true)}
          >
            <SquarePenIcon />
            Edit
          </Button>

          <DeleteTokenButton />
        </div>

        <FieldDescription>
          Saved {formatDate(token.createdAt)}
          {token.updatedAt !== token.createdAt &&
            `, last replaced ${formatDate(token.updatedAt)}`}
          .
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}

function TokenForm({
  title = "Add a token",
  submitLabel = "Save",
  onCancel,
  onSaved,
}: {
  title?: string
  submitLabel?: string
  onCancel?: () => void
  onSaved?: () => void
}) {
  const [token, setToken] = useState("")
  const saveToken = useSaveToken()

  const canSave = Boolean(token.trim()) && !saveToken.isPending

  function save(value: string) {
    const trimmed = value.trim()

    // Guarded here rather than at each caller: a paste can arrive while an
    // earlier one is still in flight.
    if (!trimmed || saveToken.isPending) {
      return
    }

    saveToken.mutate(
      { token: trimmed },
      {
        onSuccess: (result) => {
          setToken("")
          onSaved?.()
          toast.add({
            type: "success",
            title: "Token saved",
            description: `Ending in ${result.last4}`,
          })
        },
        // Stays on the form so a mistyped token can be corrected and retried.
        onError: (error) =>
          toast.add({
            type: "error",
            title: "Could not save token",
            description: error.message,
          }),
      }
    )
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text")

    if (!pasted.trim()) {
      return
    }

    const { selectionStart, selectionEnd } = event.currentTarget
    const next =
      token.slice(0, selectionStart ?? token.length) +
      pasted +
      token.slice(selectionEnd ?? token.length)

    save(next)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    save(token)
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => event.key === "Escape" && onCancel?.()}
    >
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="railway-token">{title}</FieldLabel>
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
            required
            autoFocus={Boolean(onCancel)}
            className="font-mono"
          />
          <FieldDescription>
            {saveToken.isPending
              ? "Saving…"
              : "Pasting saves it straight away — no need for the button."}{" "}
            Create one at{" "}
            <a href={RAILWAY_TOKENS} target="_blank" rel="noreferrer noopener">
              railway.com/account/tokens
            </a>
            . It is encrypted before it is stored and never shown again.
          </FieldDescription>
        </Field>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={saveToken.isPending}
            >
              Cancel
            </Button>
          )}

          <Button type="submit" size="sm" disabled={!canSave}>
            {saveToken.isPending && <Spinner />}
            {submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

function DeleteTokenButton() {
  const [open, setOpen] = useState(false)
  const deleteToken = useDeleteToken()

  function handleDelete() {
    deleteToken.mutate(undefined, {
      onSuccess: () => {
        setOpen(false)
        toast.add({
          type: "success",
          title: "Token deleted",
          description: "Add another one to reach Railway again.",
        })
      },
      // Stays open on failure so the confirm can be retried.
      onError: (error) =>
        toast.add({
          type: "error",
          title: "Could not delete token",
          description: error.message,
        }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete token"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2Icon />
        Delete
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete your token?</DialogTitle>
          <DialogDescription>
            Nothing in this app can reach Railway without it — projects,
            services and deployments all stop loading until you add another one.
            Your Railway account and everything on it is untouched.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline">
                Keep it
              </Button>
            }
          />
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteToken.isPending}
          >
            {deleteToken.isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The API sends these as ISO strings — dates don't survive JSON. */
function formatDate(value: string | Date) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "recently"
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export { TokenSection }
