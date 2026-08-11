"use client"

import { useState } from "react"

import type { ProjectOverview } from "@/lib/api/projects"
import { useUpdateProject } from "@/lib/api/projects"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { CopyButton } from "@/components/copy-button"
import { SectionHeader } from "@/components/project/settings/section-header"

/** The overview's project, not the list route's — a different shape entirely. */
type Project = ProjectOverview["project"]

/** What the project is called, and how it's identified. */
function GeneralSection({ project }: { project: Project }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="General"
        description="What this project is called and how it's identified."
      />

      <GeneralForm
        key={`${project.name}:${project.description ?? ""}`}
        project={project}
      />
    </section>
  )
}

function GeneralForm({ project }: { project: Project }) {
  // What's stored, as the inputs see it — the comparison both buttons read.
  const saved = { name: project.name, description: project.description ?? "" }

  const [name, setName] = useState(saved.name)
  const [description, setDescription] = useState(saved.description)
  const updateProject = useUpdateProject()

  // Trimmed on both sides, so trailing whitespace alone isn't an edit.
  const trimmed = { name: name.trim(), description: description.trim() }
  const isDirty =
    trimmed.name !== saved.name || trimmed.description !== saved.description
  // Railway rejects a blank name, so an emptied field can't be saved.
  const canSave = isDirty && Boolean(trimmed.name) && !updateProject.isPending

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    updateProject.mutate(
      { projectId: project.id, ...trimmed },
      {
        onSuccess: () =>
          toast.add({
            type: "success",
            title: "Project saved",
            description: trimmed.name,
          }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: "Could not save project",
            description: error.message,
          }),
      }
    )
  }

  function handleCancel() {
    setName(saved.name)
    setDescription(saved.description)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="project-name">Name</FieldLabel>
          <Input
            id="project-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={255}
            autoComplete="off"
            spellCheck={false}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="project-description">Description</FieldLabel>
          <Input
            id="project-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
            placeholder="What this project is for"
            autoComplete="off"
          />
          <FieldDescription>
            Clearing this removes the description.
          </FieldDescription>
        </Field>

        <IdField label="Project ID" value={project.id} />

        <div className="flex justify-end gap-2">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={updateProject.isPending}
            >
              Cancel
            </Button>
          )}

          <Button type="submit" size="sm" disabled={!canSave}>
            {updateProject.isPending && <Spinner />}
            Save
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

function IdField({ label, value }: { label: string; value: string }) {
  return (
    <Field>
      <FieldTitle>{label}</FieldTitle>
      <div className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-input bg-muted/50 pr-1 pl-2.5 dark:bg-muted/25">
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-muted-foreground">
          {value}
        </span>
        <CopyButton value={value} label={label} className="size-7 shrink-0" />
      </div>
    </Field>
  )
}

export { GeneralSection }
