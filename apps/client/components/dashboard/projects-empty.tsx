"use client"

import { PlusIcon, SearchIcon } from "lucide-react"

import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"

function ProjectsEmpty({ search }: { search?: string }) {
  if (search) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center">
        <SearchIcon className="size-6 text-muted-foreground" />
        <p className="max-w-full truncate text-sm font-medium">
          No projects match “{search}”
        </p>
        <p className="text-sm text-muted-foreground">Try a different search.</p>
      </div>
    )
  }

  return (
    <CreateProjectDialog
      trigger={
        <button
          type="button"
          className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center transition-colors outline-none hover:border-primary focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <PlusIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Create New Project</p>
          <p className="text-sm text-muted-foreground">
            Give it a name, a description and a repo — or let Railway name it
            for you.
          </p>
        </button>
      }
    />
  )
}

export { ProjectsEmpty }
