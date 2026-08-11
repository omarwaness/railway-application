"use client"

import { useQuery } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { sessionQueryOptions } from "@/lib/api/session"
import type { SessionUser } from "@/lib/auth-client"
import { LogoutButton } from "@/components/auth/logout-button"
import { CopyButton } from "@/components/copy-button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/settings/section-header"

/** Who's signed in, and the way out. */
function AccountSection() {
  const { data: session, isPending, error } = useQuery(sessionQueryOptions())

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Account"
        description="The details this account is signed in with."
      />

      {isPending && <AccountSkeleton />}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}

      {!isPending && !error && !session && (
        <p className="text-sm text-muted-foreground">Nobody is signed in.</p>
      )}

      {session && <AccountDetails user={session.user} />}
    </section>
  )
}

function AccountDetails({ user }: { user: SessionUser }) {
  // `||` rather than `??`: a social provider can hand back a name, but an email
  // sign-up without one leaves it an empty string, which is just as useless.
  const name = user.name || "Unnamed"

  return (
    <FieldGroup className="gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-medium text-foreground"
        >
          {initialsOf(user.name || user.email)}
        </span>

        <div className="flex min-w-0 flex-col">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <ReadOnlyField label="Name" value={name} />
      <ReadOnlyField label="Email" value={user.email} copyable />
      <ReadOnlyField label="Member since" value={formatDate(user.createdAt)} />
      <ReadOnlyField label="User ID" value={user.id} mono copyable />

      <Field orientation="horizontal" className="items-center pt-2">
        <FieldContent>
          <FieldTitle>Log out</FieldTitle>
          <FieldDescription>
            Ends this session on this device. Your Railway token stays saved.
          </FieldDescription>
        </FieldContent>

        <LogoutButton />
      </Field>
    </FieldGroup>
  )
}

function ReadOnlyField({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string
  value: string
  mono?: boolean
  copyable?: boolean
}) {
  return (
    <Field>
      <FieldTitle>{label}</FieldTitle>
      <div className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-input bg-muted/50 pr-1 pl-2.5 dark:bg-muted/25">
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm text-muted-foreground",
            mono && "font-mono"
          )}
        >
          {value}
        </span>

        {copyable && (
          <CopyButton value={value} label={label} className="size-7 shrink-0" />
        )}
      </div>
    </Field>
  )
}

function AccountSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      {[0, 1, 2, 3].map((row) => (
        <Skeleton key={row} className="h-9 w-full" />
      ))}
    </div>
  )
}

/**
 * Up to two initials from a name, falling back to the first character of
 * whatever was passed — an email address, usually.
 */
function initialsOf(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")

  return (initials || value.slice(0, 1)).toUpperCase()
}

/** better-auth types these as `Date`, but a rehydrated session hands back the
 * ISO string it was serialized as — so this takes either. */
function formatDate(value: Date | string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export { AccountSection }
