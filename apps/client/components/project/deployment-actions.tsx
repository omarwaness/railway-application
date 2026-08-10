"use client"

import { useState } from "react"
import { EllipsisVerticalIcon } from "lucide-react"

import { isInFlight, type DeploymentStatus } from "@/lib/deployment-status"
import {
  deploymentQueryOptions,
  useCancelDeployment,
  useRedeployDeployment,
  useRestartDeployment,
} from "@/lib/api/deployments"
import { useQuery } from "@tanstack/react-query"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

type ActionId = "redeploy" | "restart" | "cancel"

type Action = {
  id: ActionId
  /** Menu item, confirm button, and the verb in a failure toast. */
  label: string
  title: string
  description: string
  done: string
  destructive?: boolean
}

const REDEPLOY: Action = {
  id: "redeploy",
  label: "Redeploy",
  title: "Redeploy this deployment?",
  description:
    "Builds and ships the same commit again. The service keeps serving the current deployment until the new one is ready.",
  done: "Redeploying",
}

const RESTART: Action = {
  id: "restart",
  label: "Restart",
  title: "Restart this deployment?",
  description:
    "Replaces the running container with a fresh one from the same image. Nothing is rebuilt, and the service is briefly unavailable.",
  done: "Restarting",
}

const CANCEL: Action = {
  id: "cancel",
  label: "Cancel",
  title: "Cancel this deployment?",
  description:
    "Stops the deployment before it finishes. Whatever is already running stays as it is.",
  done: "Deployment cancelled",
  destructive: true,
}

/**
 * What can be done to one deployment, as a menu with a confirmation behind
 * each item. Every one of these either disrupts a running service or spends
 * build minutes, so none of them fire straight off the menu.
 *
 * Which items exist comes from the deployment's own record: the history list
 * carries no `canRedeploy`, so this reads the deployment itself and offers
 * nothing until it knows.
 */
function DeploymentActions({
  deploymentId,
  projectId,
  status,
}: {
  deploymentId: string
  projectId: string
  status: DeploymentStatus
}) {
  const [confirming, setConfirming] = useState<Action | null>(null)

  // A deployment still in flight has exactly one action and no capability flag
  // gates it, so there's nothing to read.
  const { data } = useQuery({
    ...deploymentQueryOptions(deploymentId),
    enabled: !isInFlight(status),
  })

  const redeploy = useRedeployDeployment()
  const restart = useRestartDeployment()
  const cancel = useCancelDeployment()

  const mutations = { redeploy, restart, cancel }
  const isPending = redeploy.isPending || restart.isPending || cancel.isPending

  const deployment = data?.deployment
  const actions: Action[] = []

  if (isInFlight(status)) {
    actions.push(CANCEL)
  } else if (deployment) {
    if (deployment.canRedeploy) {
      actions.push(REDEPLOY)
    }

    if (!deployment.deploymentStopped) {
      actions.push(RESTART)
    }
  }

  if (actions.length === 0) {
    return null
  }

  function run(action: Action) {
    mutations[action.id].mutate(
      { deploymentId, projectId },
      {
        onSuccess: () => {
          setConfirming(null)
          toast.add({
            type: "success",
            title: action.done,
            description: "Railway is working on it — this list will catch up.",
          })
        },
        // Stays open on failure so the confirm can be retried. A cancel that
        // arrives too late answers 409, and that message is the useful part.
        onError: (error) => {
          toast.add({
            type: "error",
            title: `Could not ${action.label.toLowerCase()}`,
            description: error.message,
          })
        },
      }
    )
  }

  return (
    <Dialog
      open={confirming !== null}
      onOpenChange={(open) => !open && setConfirming(null)}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Deployment actions"
            />
          }
        >
          <EllipsisVerticalIcon />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          {actions.map((action) => (
            // A menu item is a <div role="menuitem">, not a <button> — without
            // this the trigger warns about losing native button semantics.
            <DialogTrigger
              key={action.id}
              nativeButton={false}
              render={
                <DropdownMenuItem
                  variant={action.destructive ? "destructive" : undefined}
                />
              }
              onClick={() => setConfirming(action)}
            >
              {action.label}
            </DialogTrigger>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{confirming?.title}</DialogTitle>
          <DialogDescription>{confirming?.description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline">
                Keep as is
              </Button>
            }
          />
          <Button
            variant={confirming?.destructive ? "destructive" : "default"}
            onClick={() => confirming && run(confirming)}
            disabled={isPending}
          >
            {isPending && <Spinner />}
            {confirming?.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeploymentActions }
