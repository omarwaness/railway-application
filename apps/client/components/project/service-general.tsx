"use client"

import { useQuery } from "@tanstack/react-query"
import { ExternalLinkIcon } from "lucide-react"

import type { EnvironmentService } from "@/lib/api/projects"
import {
  serviceInstanceQueryOptions,
  type ServiceInstance,
} from "@/lib/api/services"
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { CopyButton } from "@/components/copy-button"

const RESTART_POLICY: Record<string, string> = {
  ALWAYS: "Always",
  NEVER: "Never",
  ON_FAILURE: "On failure",
}

function ServiceGeneral({
  service,
  environmentId,
}: {
  service: EnvironmentService
  environmentId?: string
}) {
  return (
    <FieldGroup className="gap-4 pr-6">
      <Field orientation="horizontal">
        <FieldTitle>Name</FieldTitle>
        <span className="text-sm text-muted-foreground">
          {service.serviceName}
        </span>
      </Field>

      <IdField label="Service ID" value={service.serviceId} />
      <IdField label="Instance ID" value={service.id} />

      {environmentId && (
        <InstanceFields
          serviceId={service.serviceId}
          environmentId={environmentId}
        />
      )}
    </FieldGroup>
  )
}

function InstanceFields({
  serviceId,
  environmentId,
}: {
  serviceId: string
  environmentId: string
}) {
  const { data, isPending, error } = useQuery(
    serviceInstanceQueryOptions(serviceId, { environmentId })
  )

  if (isPending) {
    return (
      <div
        aria-busy
        aria-label="Loading service details"
        className="flex flex-col gap-4"
      >
        <Skeleton className="h-5" />
        <Skeleton className="h-5" />
        <Skeleton className="h-5" />
      </div>
    )
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error.message}
      </p>
    )
  }

  const instance = data?.instance

  if (!instance) {
    return null
  }

  return (
    <>
      <Field orientation="horizontal">
        <FieldTitle>Source</FieldTitle>
        <Source source={instance.source} />
      </Field>

      {/* Null on all three means Railway decides, which is a real answer and
          not the same as an empty one. */}
      <Field orientation="horizontal">
        <FieldTitle>Region</FieldTitle>
        <Value>{instance.region ?? "Automatic"}</Value>
      </Field>

      <Field orientation="horizontal">
        <FieldTitle>Replicas</FieldTitle>
        <Value>{instance.numReplicas ?? "Automatic"}</Value>
      </Field>

      <Field orientation="horizontal">
        <FieldTitle>Restart policy</FieldTitle>
        <Value>
          {instance.restartPolicyType
            ? (RESTART_POLICY[instance.restartPolicyType] ??
              instance.restartPolicyType)
            : "Automatic"}
        </Value>
      </Field>

      {instance.rootDirectory && (
        <Field orientation="horizontal">
          <FieldTitle>Root directory</FieldTitle>
          <Code>{instance.rootDirectory}</Code>
        </Field>
      )}

      {instance.buildCommand && (
        <Field orientation="horizontal">
          <FieldTitle>Build command</FieldTitle>
          <Code>{instance.buildCommand}</Code>
        </Field>
      )}

      {instance.startCommand && (
        <Field orientation="horizontal">
          <FieldTitle>Start command</FieldTitle>
          <Code>{instance.startCommand}</Code>
        </Field>
      )}

      {instance.healthcheckPath && (
        <Field orientation="horizontal">
          <FieldTitle>Healthcheck</FieldTitle>
          <Code>{instance.healthcheckPath}</Code>
        </Field>
      )}
    </>
  )
}

function Source({ source }: { source: ServiceInstance["source"] }) {
  if (source?.repo) {
    return (
      <a
        href={`https://github.com/${source.repo}`}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
      >
        <span className="truncate">{source.repo}</span>
        <ExternalLinkIcon className="size-3.5 shrink-0" />
      </a>
    )
  }

  if (source?.image) {
    return <Code>{source.image}</Code>
  }

  return <Value>Not connected</Value>
}

/** An id: monospaced, and worth copying rather than selecting by hand. */
function IdField({ label, value }: { label: string; value: string }) {
  return (
    <Field orientation="horizontal">
      <FieldTitle>{label}</FieldTitle>
      <span className="flex min-w-0 items-center gap-1">
        <Code>{value}</Code>
        <CopyButton value={value} label={label} className="size-6" />
      </span>
    </Field>
  )
}

function Value({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-muted-foreground">{children}</span>
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <span className="truncate font-mono text-xs text-muted-foreground">
      {children}
    </span>
  )
}

export { ServiceGeneral }
