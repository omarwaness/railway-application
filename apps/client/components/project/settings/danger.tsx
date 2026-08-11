"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import type { ProjectOverview } from "@/lib/api/projects"
import { useDeleteProject } from "@/lib/api/projects"
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
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { SectionHeader } from "@/components/project/settings/section-header"

/** The overview's project, not the list route's — a different shape entirely. */
type Project = ProjectOverview["project"]

/** Irreversible, so it sits on its own at the bottom of the rail. */
function DangerSection({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const deleteProject = useDeleteProject()

  function handleDelete() {
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        setOpen(false)
        // The project this page reads is gone, so it can't stay here.
        router.replace("/dashboard")
        toast.add({
          type: "success",
          title: "Project deleted",
          description: project.name,
        })
      },
      // Stays open on failure so the confirm can be retried.
      onError: (error) =>
        toast.add({
          type: "error",
          title: "Could not delete project",
          description: error.message,
        }),
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Danger" description="Nothing here can be undone." />

      <Field orientation="horizontal" className="items-center rounded-lg">
        <FieldContent>
          <FieldDescription className="text-destructive">
            Deleting this project permanently removes every environment,
            service, deployment and volume in it. This cannot be undone.
          </FieldDescription>
        </FieldContent>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="destructive" size="sm" className="shrink-0" />
            }
          >
            Delete project
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete {project.name}?</DialogTitle>
              <DialogDescription>
                Every environment, service, deployment and volume goes with it.
                This cannot be undone.
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
                disabled={deleteProject.isPending}
              >
                {deleteProject.isPending && <Spinner />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Field>
    </section>
  )
}

export { DangerSection }
