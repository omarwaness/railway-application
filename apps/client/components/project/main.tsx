"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  projectOverviewQueryOptions,
  type ProjectOverview,
} from "@/lib/api/projects"
import {
  ProjectHeader,
  type ProjectViewName,
} from "@/components/project/header"
import { ProjectCanvas } from "@/components/project/canvas"
import { ProjectSettings } from "@/components/project/project-settings"
import { Skeleton } from "@/components/ui/skeleton"

function ProjectMain({
  projectId,
  view = "canvas",
}: {
  projectId: string
  view?: ProjectViewName
}) {
  const { data, isPending, error } = useQuery(
    projectOverviewQueryOptions(projectId)
  )

  if (isPending) {
    return (
      <div
        aria-busy
        aria-label="Loading project"
        className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-3"
      >
        <Skeleton className="h-14 shrink-0 rounded-xl" />
        <Skeleton className="min-h-0 flex-1 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    )
  }

  return <ProjectView overview={data} view={view} />
}

function ProjectView({
  overview,
  view,
}: {
  overview: ProjectOverview
  view: ProjectViewName
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Falling back when the selection isn't in the list keeps a refetch that
  // drops an environment from stranding the page on an id that's gone.
  const environmentId =
    overview.environments.find((env) => env.id === selectedId)?.id ??
    overview.primaryEnvironment?.id

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-3">
      <ProjectHeader
        overview={overview}
        environmentId={environmentId}
        onEnvironmentChange={setSelectedId}
        view={view}
      />

      {view === "canvas" ? (
        <ProjectCanvas
          // Remounts on a switch, which drops the drawer's held selection — a
          // service from the environment being left has no meaning in the new
          // one.
          key={environmentId}
          overview={overview}
          environmentId={environmentId}
        />
      ) : (
        <ProjectSettings overview={overview} environmentId={environmentId} />
      )}
    </div>
  )
}

export { ProjectMain }
