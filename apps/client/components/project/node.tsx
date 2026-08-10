import type { Node, NodeProps } from "@xyflow/react"

import { cn } from "@/lib/utils"
import type { EnvironmentService } from "@/lib/api/projects"

type DeploymentStatus = NonNullable<
  EnvironmentService["latestDeployment"]
>["status"]

/** The canvas node for one service instance. */
type ServiceNodeType = Node<{ service: EnvironmentService }, "service">

const IDLE = "bg-muted-foreground/40"
const NO_DEPLOYMENT = { dot: IDLE, label: "No deployments" }

/**
 * Dot and label per deployment status — green once it's up, red when it isn't
 * coming back, amber while it's still moving. Labels mirror the server's
 * `DEPLOYMENT_STATUS_LABEL`; the `Record` is exhaustive on purpose, so a status
 * Railway adds breaks the build here instead of rendering a silent grey dot.
 */
const STATUS: Record<DeploymentStatus, { dot: string; label: string }> = {
  SUCCESS: { dot: "bg-emerald-500", label: "Running" },
  FAILED: { dot: "bg-destructive", label: "Failed" },
  CRASHED: { dot: "bg-destructive", label: "Crashed" },
  QUEUED: { dot: "bg-amber-500", label: "Queued" },
  WAITING: { dot: "bg-amber-500", label: "Waiting to start" },
  INITIALIZING: { dot: "bg-amber-500", label: "Initializing" },
  BUILDING: { dot: "bg-amber-500", label: "Building" },
  DEPLOYING: { dot: "bg-amber-500", label: "Deploying" },
  NEEDS_APPROVAL: { dot: "bg-amber-500", label: "Waiting for approval" },
  REMOVING: { dot: IDLE, label: "Removing" },
  REMOVED: { dot: IDLE, label: "Removed" },
  SKIPPED: { dot: IDLE, label: "Skipped" },
  SLEEPING: { dot: IDLE, label: "Sleeping" },
}

function ServiceNode({ data, selected }: NodeProps<ServiceNodeType>) {
  const { serviceName, service, latestDeployment } = data.service
  const { dot, label } = latestDeployment
    ? STATUS[latestDeployment.status]
    : NO_DEPLOYMENT

  return (
    <div
      className={cn(
        "flex w-56 items-center gap-2.5 rounded-xl border bg-card px-3 py-4.5 shadow-sm transition-colors hover:border-ring/40",
        selected && "border-ring ring-3 ring-ring/50"
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
        {service.icon ? (
          // Plain `img`: these URLs are whatever Railway stored, and
          // `next/image` would need every possible host allow-listed.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={service.icon} alt="" aria-hidden className="size-4.5" />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {serviceName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        <p className="truncate text-sm font-medium">{serviceName}</p>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", dot)}
          />
          <span className="truncate">{label}</span>
        </p>
      </div>
    </div>
  )
}

export { ServiceNode }
export type { ServiceNodeType }
