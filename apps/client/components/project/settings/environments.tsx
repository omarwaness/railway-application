"use client"

import { useState } from "react"
import {
  CheckIcon,
  PlusIcon,
  SquarePenIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import {
  useCreateEnvironment,
  useDeleteEnvironment,
  useRenameEnvironment,
} from "@/lib/api/environments"
import type { ProjectOverview } from "@/lib/api/projects"
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
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { SectionHeader } from "@/components/settings/section-header"

type Environment = ProjectOverview["environments"][number]

/** Which environments exist, and which one the header opens on. */
function EnvironmentSection({ overview }: { overview: ProjectOverview }) {
  const { environments, project } = overview

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Environments"
        description="The environments in this project. The header's switcher moves between them."
      />

      <FieldGroup className="gap-1">
        {environments.map((environment) => {
          const isPrimary = environment.id === project.primaryEnvironmentId

          return (
            <EnvironmentRow
              key={environment.id}
              environment={environment}
              projectId={project.id}
              isPrimary={isPrimary}
              // The two cases the server refuses outright. Offering the control
              // and answering 400 would only be a worse way of saying no.
              canDelete={!isPrimary && environments.length > 1}
            />
          )
        })}

        {environments.length === 0 && (
          <p className="text-sm text-muted-foreground">No environments yet.</p>
        )}

        {/* Off the tight row rhythm — it acts on the list, not in it. */}
        <div className="mt-3 flex justify-end">
          <CreateEnvironmentDialog
            projectId={project.id}
            environments={environments}
          />
        </div>
      </FieldGroup>
    </section>
  )
}

function EnvironmentRow({
  environment,
  projectId,
  isPrimary,
  canDelete,
}: {
  environment: Environment
  projectId: string
  isPrimary: boolean
  canDelete: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(environment.name)
  const renameEnvironment = useRenameEnvironment()

  const trimmed = name.trim()
  const canSave =
    Boolean(trimmed) &&
    trimmed !== environment.name &&
    !renameEnvironment.isPending

  function stopEditing() {
    setIsEditing(false)
    // Back to what's stored, so reopening never starts on an abandoned edit.
    setName(environment.name)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    renameEnvironment.mutate(
      { environmentId: environment.id, projectId, name: trimmed },
      {
        onSuccess: () => {
          setIsEditing(false)
          toast.add({
            type: "success",
            title: "Environment renamed",
            description: trimmed,
          })
        },
        // Stays open on failure so the name can be corrected and retried.
        onError: (error) =>
          toast.add({
            type: "error",
            title: "Could not rename environment",
            description: error.message,
          }),
      }
    )
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit}
        onKeyDown={(event) => event.key === "Escape" && stopEditing()}
        // Same inset as the row it replaces, so nothing shifts on entering edit.
        className="-mx-2 flex items-center gap-2 px-2"
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label={`Rename ${environment.name}`}
          maxLength={255}
          autoComplete="off"
          spellCheck={false}
          required
          autoFocus
          className="h-8 min-w-0 flex-1"
        />

        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label="Save name"
          disabled={!canSave}
        >
          {renameEnvironment.isPending ? <Spinner /> : <CheckIcon />}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Cancel rename"
          onClick={stopEditing}
          disabled={renameEnvironment.isPending}
        >
          <XIcon />
        </Button>
      </form>
    )
  }

  return (
    <Field
      orientation="horizontal"
      // Negative margin so the fill bleeds past the text without pushing the
      // names out of line with the rest of the column.
      className="-mx-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
    >
      <FieldTitle>{environment.name}</FieldTitle>

      <span className="flex shrink-0 items-center gap-1">
        <span className="text-sm text-muted-foreground">
          {isPrimary
            ? "Primary"
            : `${environment.unmergedChangesCount ?? 0} staged changes`}
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Rename ${environment.name}`}
          onClick={() => setIsEditing(true)}
          className="size-6"
        >
          <SquarePenIcon />
        </Button>

        {canDelete && (
          <DeleteEnvironmentButton
            environment={environment}
            projectId={projectId}
          />
        )}
      </span>
    </Field>
  )
}

function DeleteEnvironmentButton({
  environment,
  projectId,
}: {
  environment: Environment
  projectId: string
}) {
  const [open, setOpen] = useState(false)
  const deleteEnvironment = useDeleteEnvironment()

  function handleDelete() {
    deleteEnvironment.mutate(
      { environmentId: environment.id, projectId },
      {
        onSuccess: () => {
          setOpen(false)
          toast.add({
            type: "success",
            title: "Environment deleted",
            description: environment.name,
          })
        },
        // Stays open on failure so the confirm can be retried.
        onError: (error) =>
          toast.add({
            type: "error",
            title: "Could not delete environment",
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
            aria-label={`Delete ${environment.name}`}
            className="size-6 text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2Icon />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {environment.name}?</DialogTitle>
          <DialogDescription>
            Every service, deployment and variable in this environment goes with
            it. Services in your other environments are untouched. This cannot
            be undone.
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
            disabled={deleteEnvironment.isPending}
          >
            {deleteEnvironment.isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The "don't fork" option. A sentinel rather than `""`, which the Select
 * treats as a value like any other and would be easy to confuse with unset. */
const EMPTY_SOURCE = "empty"

function CreateEnvironmentDialog({
  projectId,
  environments,
}: {
  projectId: string
  environments: Environment[]
}) {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState(environments[0]?.id ?? EMPTY_SOURCE)
  const createEnvironment = useCreateEnvironment()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()

    if (!name) {
      return
    }

    createEnvironment.mutate(
      {
        projectId,
        name,
        ...(source !== EMPTY_SOURCE && { sourceEnvironmentId: source }),
      },
      {
        onSuccess: () =>
          toast.add({
            type: "success",
            title: "Environment created",
            description: name,
          }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: "Could not create environment",
            description: error.message,
          }),
        // Closes either way — the toast is what reports which way it went.
        onSettled: () => setOpen(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="secondary">
            <PlusIcon />
            New environment
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>New environment</DialogTitle>
            <DialogDescription>
              Forking copies the source environment&apos;s services and
              variables. Railway starts deploying them once it&apos;s created.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="environment-name">Name</FieldLabel>
              <Input
                id="environment-name"
                name="name"
                placeholder="staging"
                autoComplete="off"
                spellCheck={false}
                maxLength={255}
                required
                autoFocus
              />
            </Field>

            {environments.length > 0 && (
              <Field>
                <FieldLabel htmlFor="environment-source">Fork from</FieldLabel>
                <Select
                  value={source}
                  onValueChange={(value) => setSource(value as string)}
                >
                  <SelectTrigger id="environment-source" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        environments.find((env) => env.id === value)?.name ??
                        "Empty environment"
                      }
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {environments.map((environment) => (
                      <SelectItem key={environment.id} value={environment.id}>
                        {environment.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={EMPTY_SOURCE}>
                      Empty environment
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={createEnvironment.isPending}>
              {createEnvironment.isPending && <Spinner />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { EnvironmentSection }
