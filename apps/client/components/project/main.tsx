"use client"

import { useQuery } from "@tanstack/react-query"

import { projectOverviewQueryOptions } from "@/lib/api/projects"
import { ProjectHeader } from "@/components/project/header"
import { ProjectCanvas } from "@/components/project/canvas"
import { Skeleton } from "@/components/ui/skeleton"

function ProjectMain({ projectId }: { projectId: string }) {
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

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-3">
      <ProjectHeader overview={data} />
      <ProjectCanvas overview={data} />
    </div>
  )
}

export { ProjectMain }
