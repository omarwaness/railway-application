"use client"

import { ExternalLinkIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { EnvironmentService } from "@/lib/api/projects"
import { deploymentStatus } from "@/lib/deployment-status"
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field"

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function ServiceDeployment({
  service,
}: {
  service: EnvironmentService | null
}) {
  const latest = service?.latestDeployment
  const { dot, label } = deploymentStatus(latest ?? null)

  if (!latest) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No deployments yet
      </p>
    )
  }

  return (
    <FieldGroup className="gap-4">
      <Field orientation="horizontal">
        <FieldTitle>Status</FieldTitle>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", dot)}
          />
          {label}
        </span>
      </Field>

      <Field orientation="horizontal">
        <FieldTitle>Deployed</FieldTitle>
        <span className="text-sm text-muted-foreground">
          {formatter.format(new Date(latest.createdAt))}
        </span>
      </Field>

      <Field orientation="horizontal">
        <FieldTitle>Deployment ID</FieldTitle>
        <span className="font-mono text-xs text-muted-foreground">
          {latest.id}
        </span>
      </Field>

      {latest.staticUrl && (
        <Field orientation="horizontal">
          <FieldTitle>URL</FieldTitle>
          <a
            href={`https://${latest.staticUrl}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 truncate text-sm text-primary underline-offset-4 hover:underline"
          >
            <span className="truncate">{latest.staticUrl}</span>
            <ExternalLinkIcon className="size-3.5 shrink-0" />
          </a>
        </Field>
      )}
    </FieldGroup>
  )
}

export { ServiceDeployment }
