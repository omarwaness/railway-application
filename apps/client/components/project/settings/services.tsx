"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useEnvironmentServices } from "@/lib/api/environments"
import type { EnvironmentService, ProjectOverview } from "@/lib/api/projects"
import { useDeleteService } from "@/lib/api/services"
import { deploymentStatus } from "@/lib/deployment-status"
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
import { SectionHeader } from "@/components/settings/section-header"

function ServicesSection({
  overview,
  environmentId,
}: {
  overview: ProjectOverview
  environmentId?: string
}) {
  const { services, isLoading } = useEnvironmentServices(
    overview,
    environmentId
  )
  const environment = overview.environments.find(
    (env) => env.id === environmentId
  )

  // Soft-deleted services come back with `deletedAt` intact, same as the canvas.
  const live = (services ?? []).filter(({ service }) => !service.deletedAt)

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Services"
        description={
          environment
            ? `What's running in ${environment.name}. Switch environments in the header to see another.`
            : "This project has no environment to run services in."
        }
      />

      {isLoading ? (
        <div
          aria-busy
          aria-label="Loading services"
          className="flex flex-col gap-2"
        >
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      ) : live.length === 0 ? (
        <p className="text-sm text-muted-foreground">No services yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {live.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              projectId={overview.project.id}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

/** One service: what it's called, and how its last deployment went. */
function ServiceRow({
  service,
  projectId,
}: {
  service: EnvironmentService
  projectId: string
}) {
  const { dot, label } = deploymentStatus(service.latestDeployment)

  return (
    <li className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
        {service.service.icon ? (
          // Plain `img`: these URLs are whatever Railway stored, and
          // `next/image` would need every possible host allow-listed.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.service.icon}
            alt=""
            aria-hidden
            className="size-4"
          />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {service.serviceName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm font-medium">{service.serviceName}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", dot)}
          />
          <span className="truncate">{label}</span>
        </p>
      </div>

      <CopyButton
        value={service.serviceId}
        label="Service ID"
        className="size-6 shrink-0"
      />

      <DeleteServiceButton service={service} projectId={projectId} />
    </li>
  )
}

function DeleteServiceButton({
  service,
  projectId,
}: {
  service: EnvironmentService
  projectId: string
}) {
  const [open, setOpen] = useState(false)
  const deleteService = useDeleteService()

  function handleDelete() {
    deleteService.mutate(
      { serviceId: service.serviceId, projectId },
      {
        onSuccess: () => {
          setOpen(false)
          toast.add({
            type: "success",
            title: "Service deleted",
            description: service.serviceName,
          })
        },
        // Stays open on failure so the confirm can be retried.
        onError: (error) =>
          toast.add({
            type: "error",
            title: "Could not delete service",
            description: error.message,
          }),
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
            aria-label={`Delete ${service.serviceName}`}
            className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2Icon />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {service.serviceName}?</DialogTitle>
          <DialogDescription>
            This removes the service from every environment, along with its
            deployments, variables and domains. It cannot be undone.
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
            disabled={deleteService.isPending}
          >
            {deleteService.isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ServicesSection }
