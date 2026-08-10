import type { Node, NodeProps } from "@xyflow/react"

import { cn } from "@/lib/utils"
import type { EnvironmentService } from "@/lib/api/projects"
import { deploymentStatus } from "@/lib/deployment-status"

/** The canvas node for one service instance. */
type ServiceNodeType = Node<{ service: EnvironmentService }, "service">

function ServiceNode({ data, selected }: NodeProps<ServiceNodeType>) {
  const { serviceName, service, latestDeployment } = data.service
  const { dot, label } = deploymentStatus(latestDeployment)

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
