"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ExternalLinkIcon, PlusIcon, Trash2Icon } from "lucide-react"

import type { EnvironmentService } from "@/lib/api/projects"
import {
  serviceDomainsQueryOptions,
  useCreateServiceDomain,
  useDeleteDomain,
  type DomainKind,
  type DomainScope,
} from "@/lib/api/domains"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { CopyButton } from "@/components/copy-button"

function ServiceDomains({
  service,
  projectId,
  environmentId,
}: {
  service: EnvironmentService | null
  environmentId?: string
  projectId: string
}) {
  if (!service || !environmentId) {
    return null
  }

  return (
    <DomainList
      scope={{ projectId, environmentId, serviceId: service.serviceId }}
    />
  )
}

function DomainList({ scope }: { scope: DomainScope }) {
  const { data, isPending, error } = useQuery(serviceDomainsQueryOptions(scope))

  const domains = [
    ...(data?.serviceDomains ?? []).map((domain) => ({
      ...domain,
      kind: "service" as const,
    })),
    ...(data?.customDomains ?? []).map((domain) => ({
      ...domain,
      kind: "custom" as const,
    })),
  ]

  return (
    <div className="flex flex-col gap-2 pr-6">
      {isPending && (
        <div
          aria-busy
          aria-label="Loading domains"
          className="flex flex-col gap-2"
        >
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      )}

      {error && (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {error.message}
        </p>
      )}

      {data && domains.length === 0 && (
        <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          No domains yet
        </p>
      )}

      {domains.length > 0 && (
        <ul className="flex flex-col gap-2">
          {domains.map(({ id, domain, kind }) => (
            <DomainRow key={id} id={id} domain={domain} kind={kind} />
          ))}
        </ul>
      )}

      <GenerateDomainButton scope={scope} />
    </div>
  )
}

/**
 * Nothing to fill in — Railway picks the name — so this is one button rather
 * than a form or a confirmation. The new domain shows up in the list above once
 * the refetch lands, still CREATING.
 */
function GenerateDomainButton({ scope }: { scope: DomainScope }) {
  const createDomain = useCreateServiceDomain()

  function handleGenerate() {
    createDomain.mutate(
      { serviceId: scope.serviceId, environmentId: scope.environmentId },
      {
        onSuccess: ({ serviceDomain }) => {
          toast.add({
            type: "success",
            title: "Domain generated",
            description: `${serviceDomain.domain} — it takes a moment to start answering.`,
          })
        },
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Could not generate domain",
            description: error.message,
          })
        },
      }
    )
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleGenerate}
      disabled={createDomain.isPending}
      className="self-start"
    >
      {createDomain.isPending ? <Spinner /> : <PlusIcon />}
      Generate domain
    </Button>
  )
}

function DomainRow({
  id,
  domain,
  kind,
}: {
  id: string
  domain: string
  kind: DomainKind
}) {
  const url = `https://${domain}`

  return (
    <li className="flex items-center gap-1 rounded-lg border py-1 pr-1 pl-3">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
      >
        <span className="truncate">{domain}</span>
        <ExternalLinkIcon className="size-3.5 shrink-0" />
      </a>

      {/* The full URL, not the bare host — pasting it into a browser or a
          config is what this is for. */}
      <CopyButton value={url} label={domain} />

      <DeleteDomainButton id={id} domain={domain} kind={kind} />
    </li>
  )
}

/**
 * Behind a confirmation, like every other destructive action here: the service
 * stops answering on this address the moment it's gone, and a generated domain
 * can only be replaced by a differently-named one.
 */
function DeleteDomainButton({
  id,
  domain,
  kind,
}: {
  id: string
  domain: string
  kind: DomainKind
}) {
  const [open, setOpen] = useState(false)
  const deleteDomain = useDeleteDomain()

  function handleDelete() {
    deleteDomain.mutate(
      { id, kind },
      {
        onSuccess: () => {
          setOpen(false)
          toast.add({
            type: "success",
            title: "Domain removed",
            description: domain,
          })
        },
        // Stays open on failure so the confirm can be retried.
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Could not remove domain",
            description: error.message,
          })
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${domain}`}
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2Icon />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {domain}?</DialogTitle>
          <DialogDescription>
            {kind === "custom"
              ? "The service stops answering here. Railway forgets the domain, but your own DNS records keep pointing at it until you clear them."
              : "The service stops answering here. Generating another gives you a new name, not this one back."}
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
            disabled={deleteDomain.isPending}
          >
            {deleteDomain.isPending && <Spinner />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ServiceDomains }
