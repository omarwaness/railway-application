"use client"

import { useQuery } from "@tanstack/react-query"
import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { EnvironmentService } from "@/lib/api/projects"
import {
  serviceDeploymentsQueryOptions,
  type ServiceDeploymentScope,
} from "@/lib/api/deployments"
import { deploymentStatus, isInFlight } from "@/lib/deployment-status"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { DeploymentActions } from "@/components/project/deployment-actions"
import { DeploymentLogs } from "@/components/project/deployment-logs"

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

/** Every deployment the panel renders, whichever request it arrived on. */
type Deployment = {
  id: string
  status: NonNullable<EnvironmentService["latestDeployment"]>["status"]
  createdAt: string
  staticUrl?: string | null
}

function ServiceDeployment({
  service,
  projectId,
  environmentId,
}: {
  service: EnvironmentService | null
  projectId: string
  environmentId?: string
}) {
  if (!service || !environmentId) {
    return null
  }

  return (
    <DeploymentHistory
      scope={{ projectId, environmentId, serviceId: service.serviceId }}
      // Already in hand from the overview, so the card paints before the
      // history request lands.
      fallback={service.latestDeployment}
    />
  )
}

function DeploymentHistory({
  scope,
  fallback,
}: {
  scope: ServiceDeploymentScope
  fallback: Deployment | null
}) {
  const { data, isPending, error } = useQuery(
    serviceDeploymentsQueryOptions(scope)
  )

  // Newest first. The overview's own copy stands in until the list arrives.
  const [newest, ...rest] = data?.deployments ?? (fallback ? [fallback] : [])

  // A deploy that's still moving hasn't replaced anything yet: the newest
  // record is the one building, while the newest settled one is what's still
  // serving traffic and keeps the top card.
  const inProgress = newest && isInFlight(newest.status) ? newest : null
  const active = inProgress
    ? (rest.find((deployment) => !isInFlight(deployment.status)) ?? null)
    : (newest ?? null)

  // Both cards are pulled out of the list so neither shows up twice.
  const history = (data?.deployments ?? []).filter(
    (deployment) => deployment !== active && deployment !== inProgress
  )

  return (
    <div className="flex flex-col gap-4">
      {active && (
        <DeploymentCard
          deployment={active}
          badge={inProgress ? "Active" : "Latest"}
          projectId={scope.projectId}
        />
      )}

      {inProgress && (
        <DeploymentCard
          deployment={inProgress}
          badge={
            <>
              <Spinner className="size-3" />
              In progress
            </>
          }
          projectId={scope.projectId}
        />
      )}

      {!active &&
        !inProgress &&
        (isPending ? (
          <Skeleton
            aria-label="Loading deployment"
            className="h-40 rounded-xl"
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No deployments yet
          </p>
        ))}

      <div className="flex items-center gap-3">
        <h3 className="text-xs font-medium text-muted-foreground">History</h3>
        <Separator className="flex-1" />
      </div>

      {isPending && (
        <div
          aria-busy
          aria-label="Loading deployment history"
          className="flex flex-col gap-2"
        >
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      )}

      {error && (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {error.message}
        </p>
      )}

      {data && history.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No earlier deployments
        </p>
      )}

      {history.length > 0 && (
        <ul className="flex flex-col gap-2">
          {history.map((deployment) => (
            <DeploymentRow key={deployment.id} deployment={deployment} />
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * One deployment in full: its status, when it went out, and its logs. The
 * badge is what tells two of these apart when a deploy is in flight — the top
 * card is what's serving, the one below it is what's building.
 */
function DeploymentCard({
  deployment,
  badge,
  projectId,
}: {
  deployment: Deployment
  badge: React.ReactNode
  projectId: string
}) {
  const { dot, label } = deploymentStatus(deployment)

  return (
    <Collapsible className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span
            aria-hidden
            className={cn("size-2 shrink-0 rounded-full", dot)}
          />
          {label}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {badge}
          </span>

          <DeploymentActions
            deploymentId={deployment.id}
            projectId={projectId}
            status={deployment.status}
          />
        </div>
      </div>

      <FieldGroup className="gap-3">
        <Field orientation="horizontal">
          <FieldTitle>Deployed</FieldTitle>
          <time
            dateTime={deployment.createdAt}
            className="text-sm text-muted-foreground"
          >
            {formatter.format(new Date(deployment.createdAt))}
          </time>
        </Field>

        <Field orientation="horizontal">
          <FieldTitle>Deployment ID</FieldTitle>
          <span className="font-mono text-xs text-muted-foreground">
            {deployment.id}
          </span>
        </Field>

        {deployment.staticUrl && (
          <Field orientation="horizontal">
            <FieldTitle>URL</FieldTitle>
            <a
              href={`https://${deployment.staticUrl}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 truncate text-sm text-primary underline-offset-4 hover:underline"
            >
              <span className="truncate">{deployment.staticUrl}</span>
              <ExternalLinkIcon className="size-3.5 shrink-0" />
            </a>
          </Field>
        )}
      </FieldGroup>

      <CollapsibleTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="group/logs w-full justify-between"
          />
        }
      >
        View logs
        <ChevronDownIcon className="transition-transform duration-150 ease-out group-data-panel-open/logs:rotate-180" />
      </CollapsibleTrigger>

      {/* Height animation per Base UI: the panel publishes its own height as a
          variable, and the starting/ending styles are what it transitions from
          and back to. The `hidden` rule keeps a closed panel out of the flow. */}
      <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 [&[hidden]:not([hidden='until-found'])]:hidden">
        <DeploymentLogs deploymentId={deployment.id} />
      </CollapsibleContent>
    </Collapsible>
  )
}

function DeploymentRow({ deployment }: { deployment: Deployment }) {
  const { dot, label } = deploymentStatus(deployment)

  return (
    <li className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot)} />

      <span className="shrink-0 text-sm">{label}</span>

      <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
        {deployment.id}
      </span>

      <time
        dateTime={deployment.createdAt}
        className="shrink-0 text-xs text-muted-foreground"
      >
        {formatter.format(new Date(deployment.createdAt))}
      </time>
    </li>
  )
}

export { ServiceDeployment }
