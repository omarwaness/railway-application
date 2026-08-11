import type { EnvironmentService } from "@/lib/api/projects"

type LatestDeployment = EnvironmentService["latestDeployment"]
type DeploymentStatus = NonNullable<LatestDeployment>["status"]

const IDLE = "bg-muted-foreground/40"
const NO_DEPLOYMENT = { dot: IDLE, label: "No deployments" }


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

/**
 * How to present a deployment, or the idle pair when there is none. Typed on
 * the status alone so it reads a history entry as happily as a service's
 * `latestDeployment` — the two shapes differ in every other field.
 */
function deploymentStatus(deployment: { status: DeploymentStatus } | null) {
  return deployment ? STATUS[deployment.status] : NO_DEPLOYMENT
}

/**
 * Whether a deployment is still moving under its own steam — what tells a poll
 * to keep going. `NEEDS_APPROVAL` is excluded: it waits on a person, and
 * nothing changes until one acts.
 */
const IN_FLIGHT = new Set<DeploymentStatus>([
  "QUEUED",
  "WAITING",
  "INITIALIZING",
  "BUILDING",
  "DEPLOYING",
  "REMOVING",
])

function isInFlight(status: DeploymentStatus) {
  return IN_FLIGHT.has(status)
}

export { deploymentStatus, isInFlight }
export type { DeploymentStatus, LatestDeployment }
