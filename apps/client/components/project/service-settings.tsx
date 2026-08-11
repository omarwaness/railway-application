"use client"

import { useState } from "react"

import type { EnvironmentService } from "@/lib/api/projects"
import { useDeleteService } from "@/lib/api/services"
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
import { Field, FieldContent, FieldDescription } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ServiceDomains } from "@/components/project/service-domains"
import { ServiceGeneral } from "@/components/project/service-general"

function ServiceSettings({
  service,
  projectId,
  environmentId,
  onDeleted,
}: {
  service: EnvironmentService | null
  projectId: string
  environmentId?: string
  /** Called once the service is gone, so the panel showing it can close. */
  onDeleted?: () => void
}) {
  if (!service) {
    return null
  }

  return (
    <div className="flex flex-col gap-8">
      <GeneralSection service={service} environmentId={environmentId} />
      <DomainSection
        service={service}
        projectId={projectId}
        environmentId={environmentId}
      />
      <DangerSection
        service={service}
        projectId={projectId}
        onDeleted={onDeleted}
      />
    </div>
  )
}

/** What the service is: its identity, and how it's built and run here. */
function GeneralSection({
  service,
  environmentId,
}: {
  service: EnvironmentService
  environmentId?: string
}) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="General"
        description="Details of this service and the environment it runs in."
      />

      <ServiceGeneral service={service} environmentId={environmentId} />
    </section>
  )
}

/** Where the service answers from. */
function DomainSection({
  service,
  projectId,
  environmentId,
}: {
  service: EnvironmentService
  projectId: string
  environmentId?: string
}) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Domain"
        description="The addresses this service is reachable at."
      />

      <ServiceDomains
        service={service}
        projectId={projectId}
        environmentId={environmentId}
      />
    </section>
  )
}

/** Everything here is irreversible, so it sits on its own at the bottom. */
function DangerSection({
  service,
  projectId,
  onDeleted,
}: {
  service: EnvironmentService
  projectId: string
  onDeleted?: () => void
}) {
  const [open, setOpen] = useState(false)
  const deleteService = useDeleteService()

  function handleDelete() {
    deleteService.mutate(
      { serviceId: service.serviceId, projectId },
      {
        onSuccess: () => {
          setOpen(false)
          onDeleted?.()
          toast.add({
            type: "success",
            title: "Service deleted",
            description: service.serviceName,
          })
        },
        // Stays open on failure so the confirm can be retried.
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Could not delete service",
            description: error.message,
          })
        },
      }
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Danger" description="" />

      <Field orientation="horizontal" className="items-center rounded-lg pr-6 pb-12">
        <FieldContent>
          <FieldDescription className="text-destructive">
            Deleting this service will permanently delete all its deployments
            and remove it from this environment. This cannot be undone.
          </FieldDescription>
        </FieldContent>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="destructive" size="sm" className="shrink-0" />
            }
          >
            Delete
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
      </Field>
    </section>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 pr-6">
        <h3 className="shrink-0 text-sm font-medium">{title}</h3>
        <Separator className="flex-1" />
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export { ServiceSettings }
