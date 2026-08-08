"use client"

import { useState } from "react"
import {
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  type LucideIcon,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { projectsQueryOptions } from "@/lib/api/projects"
import {
  ProjectCard,
  PROJECT_GRID_CLASSNAME,
  type ProjectView,
} from "@/components/dashboard/project-card"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { ProjectLoading } from "@/components/dashboard/project-loading"
import { ProjectsEmpty } from "@/components/dashboard/projects-empty"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

const VIEWS: { value: ProjectView; label: string; icon: LucideIcon }[] = [
  { value: "grid", label: "Grid view", icon: LayoutGridIcon },
  { value: "list", label: "List view", icon: ListIcon },
]

function ProjectsList() {
  const [view, setView] = useState<ProjectView>("grid")
  const [search, setSearch] = useState("")
  const { data, isPending, error } = useQuery(projectsQueryOptions())

  const query = search.trim().toLowerCase()

  // Railway soft-deletes: a deleted project keeps coming back with a
  // `deletedAt` set, and the count has to agree with the cards.
  const projects = (data?.projects ?? []).filter(
    ({ name, deletedAt }) => !deletedAt && name.toLowerCase().includes(query)
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 pt-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-[1.75rem] leading-none font-normal">Projects</h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search projects"
              placeholder="Search projects"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-64 pl-8"
            />
          </div>

          <CreateProjectDialog />
        </div>
      </header>

      {isPending ? (
        <ProjectLoading />
      ) : error ? (
        <div
          role="alert"
          className="flex flex-1 items-center justify-center rounded-xl border p-6"
        >
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      ) : projects.length === 0 ? (
        <ProjectsEmpty search={search.trim()} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <LayoutGridIcon className="size-4 text-muted-foreground" />
              <span className="font-medium">
                {projects.length}{" "}
                {projects.length === 1 ? "Project" : "Projects"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {VIEWS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                  className={cn(view === value && "bg-muted text-foreground")}
                >
                  <Icon />
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div
              className={cn(
                view === "grid" ? PROJECT_GRID_CLASSNAME : "flex flex-col gap-3"
              )}
            >
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} view={view} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

export { ProjectsList }
