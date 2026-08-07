import type { DeploymentStatus } from "../gql/generated/graphql";

/**
 * Railway's deployment statuses, as values rather than just a type.
 *
 * Codegen emits `DeploymentStatus` as a union of string literals, which is
 * only usable at compile time — there's nothing to enumerate, validate a query
 * param against, or group at runtime. This is that missing half.
 *
 * The `satisfies Record<DeploymentStatus, ...>` on each map is load-bearing:
 * if Railway adds a status and codegen picks it up, the missing key fails the
 * build here instead of silently falling through a switch at runtime.
 */
export const DEPLOYMENT_STATUS = {
    QUEUED: "QUEUED",
    WAITING: "WAITING",
    INITIALIZING: "INITIALIZING",
    BUILDING: "BUILDING",
    DEPLOYING: "DEPLOYING",
    NEEDS_APPROVAL: "NEEDS_APPROVAL",
    SUCCESS: "SUCCESS",
    SLEEPING: "SLEEPING",
    FAILED: "FAILED",
    CRASHED: "CRASHED",
    SKIPPED: "SKIPPED",
    REMOVING: "REMOVING",
    REMOVED: "REMOVED",
} as const satisfies Record<DeploymentStatus, DeploymentStatus>;

export const DEPLOYMENT_STATUSES = Object.values(DEPLOYMENT_STATUS);

/**
 * Human-readable labels. Railway's own docs omit INITIALIZING, NEEDS_APPROVAL
 * and REMOVING, and describe WAITING as "waiting for approval" — which is
 * really what NEEDS_APPROVAL means. Both exist as distinct statuses, so these
 * descriptions keep them apart.
 */
export const DEPLOYMENT_STATUS_LABEL = {
    QUEUED: "Queued",
    WAITING: "Waiting to start",
    INITIALIZING: "Initializing",
    BUILDING: "Building",
    DEPLOYING: "Deploying",
    NEEDS_APPROVAL: "Waiting for approval",
    SUCCESS: "Running",
    SLEEPING: "Sleeping",
    FAILED: "Failed",
    CRASHED: "Crashed",
    SKIPPED: "Skipped",
    REMOVING: "Removing",
    REMOVED: "Removed",
} as const satisfies Record<DeploymentStatus, string>;

/**
 * Statuses that are still moving — a client polling `deployment(id)` should
 * keep polling while the status is in here and stop once it isn't.
 *
 * NEEDS_APPROVAL is deliberately excluded: it's stalled, not progressing, and
 * won't change until someone calls `deploymentApprove`.
 */
export const IN_PROGRESS_STATUSES = [
    DEPLOYMENT_STATUS.QUEUED,
    DEPLOYMENT_STATUS.WAITING,
    DEPLOYMENT_STATUS.INITIALIZING,
    DEPLOYMENT_STATUS.BUILDING,
    DEPLOYMENT_STATUS.DEPLOYING,
    DEPLOYMENT_STATUS.REMOVING,
] as const;

/** Statuses that mean the deployment isn't serving traffic and won't recover. */
export const FAILED_STATUSES = [
    DEPLOYMENT_STATUS.FAILED,
    DEPLOYMENT_STATUS.CRASHED,
] as const;

export function isInProgress(status: DeploymentStatus): boolean {
    return (IN_PROGRESS_STATUSES as readonly DeploymentStatus[]).includes(status);
}

export function isFailed(status: DeploymentStatus): boolean {
    return (FAILED_STATUSES as readonly DeploymentStatus[]).includes(status);
}
