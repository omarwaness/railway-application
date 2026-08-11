"use client"

import { useState } from "react"
import {
  ArrowRightIcon,
  ContainerIcon,
  GitBranchIcon,
  PlusIcon,
  SquareDashedIcon,
} from "lucide-react"

import { useCreateService } from "@/lib/api/services"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/**
 * What the single input means. An empty service is named by what's typed;
 * the other two are sources, and Railway names the service after them.
 */
type Source = "empty" | "repo" | "image"

const sources = {
  empty: {
    label: "Empty service",
    placeholder: "Service name",
    icon: SquareDashedIcon,
  },
  repo: {
    label: "Git repo",
    placeholder: "owner/repo",
    icon: GitBranchIcon,
  },
  image: {
    label: "Docker image",
    placeholder: "postgres:17-alpine",
    icon: ContainerIcon,
  },
} as const satisfies Record<
  Source,
  { label: string; placeholder: string; icon: React.ElementType }
>

const order = ["empty", "repo", "image"] as const

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
  environmentId?: string
  trigger?: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<Source>("empty")
  const [text, setText] = useState("")
  const createService = useCreateService()

  const value = text.trim()
  // A source has to be typed out; an unnamed empty service is Railway's to name.
  const canSubmit = source === "empty" || value.length > 0

  /** Each mode reads the input differently, so switching drops what was typed. */
  function pick(next: Source) {
    setSource(next)
    setText("")
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) pick("empty")
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    createService.mutate(
      {
        projectId,
        ...(environmentId && { environmentId }),
        ...(source === "empty" && value && { name: value }),
        ...(source === "repo" && { source: { repo: value } }),
        ...(source === "image" && { source: { image: value } }),
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
        onSettled: () => handleOpenChange(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      {/* No close button: the input sits where it would, and Cancel is right
          there in the footer. */}
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogTitle className="sr-only">New service</DialogTitle>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Input
              name="source"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={sources[source].placeholder}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
            />

            {/* Only the two modes you aren't in — the placeholder says which
                one you are. */}
            <div className="flex flex-col gap-2">
              {order
                .filter((option) => option !== source)
                .map((option) => {
                  const { label, icon: Icon } = sources[option]

                  return (
                    <Button
                      key={option}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => pick(option)}
                    >
                      <Icon className="text-muted-foreground" />
                      {label}
                      <ArrowRightIcon
                        data-icon="inline-end"
                        className="ml-auto text-muted-foreground"
                      />
                    </Button>
                  )
                })}
            </div>
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button
              type="submit"
              disabled={!canSubmit || createService.isPending}
            >
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
