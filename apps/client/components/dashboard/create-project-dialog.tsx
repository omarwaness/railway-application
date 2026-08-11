"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"

import { useCreateProject } from "@/lib/api/projects"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/** Blank fields are left out entirely rather than sent as empty strings. */
function value(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim() || undefined
}

function CreateProjectDialog({
  trigger = (
    <Button>
      <PlusIcon />
      New
    </Button>
  ),
}: {
  trigger?: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const createProject = useCreateProject()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)

    createProject.mutate(
      {
        name: value(data, "name"),
        description: value(data, "description"),
      },
      {
        onSuccess: ({ project }) => {
          router.push(`/project/${project.id}`)
          toast.add({
            type: "success",
            title: "Project created",
            description: project.name,
          })
        },
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Could not create project",
            description: error.message,
          })
        },
        // Closes either way — the toast is what reports which way it went.
        onSettled: () => setOpen(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />

      {/* The form lives inside the popup: `DialogContent` is portalled, so a
          form wrapping the trigger wouldn't contain these inputs. */}
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Name it and describe it. Leave anything blank and Railway fills it
              in.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="project-name">Name</FieldLabel>
              <Input
                id="project-name"
                name="name"
                placeholder="my-project"
                autoComplete="off"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-description">Description</FieldLabel>
              <Input
                id="project-description"
                name="description"
                placeholder="What this project is for"
                autoComplete="off"
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && <Spinner />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateProjectDialog }
