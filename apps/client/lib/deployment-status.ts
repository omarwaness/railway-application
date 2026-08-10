import type { EnvironmentService } from "@/lib/api/projects"

type LatestDeployment = EnvironmentService["latestDeployment"]
type DeploymentStatus = NonNullable<LatestDeployment>["status"]

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

/** How to present a service's latest deployment, or the idle pair when it has none. */
function deploymentStatus(latest: LatestDeployment) {
  return latest ? STATUS[latest.status] : NO_DEPLOYMENT
}

export { deploymentStatus }
export type { DeploymentStatus, LatestDeployment }
