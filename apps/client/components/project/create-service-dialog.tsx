"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { useCreateService } from "@/lib/api/services"
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

function CreateServiceDialog({
  projectId,
  environmentId,
  trigger = (
    <Button size="sm">
      <PlusIcon />
      Add
    </Button>
  ),
}: {
  projectId: string
  /** The environment on screen. Only narrows creation when it's a fork. */
  environmentId?: string
  trigger?: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const createService = useCreateService()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    // Blank is left out entirely rather than sent as an empty string — the
    // server rejects "" and Railway names the service itself when it's absent.
    const name = String(data.get("name") ?? "").trim() || undefined

    createService.mutate(
      {
        projectId,
        ...(name && { name }),
        ...(environmentId && { environmentId }),
      },
      {
        onSuccess: ({ service }) => {
          toast.add({
            type: "success",
            title: "Service created",
            description: service.name,
          })
        },
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Could not create service",
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
            <DialogTitle>New service</DialogTitle>
            <DialogDescription>
              Name the service you want to add to this environment.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="service-name">Name</FieldLabel>
              <Input
                id="service-name"
                name="name"
                placeholder="my-service"
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
            <Button type="submit" disabled={createService.isPending}>
              {createService.isPending && <Spinner />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateServiceDialog }
