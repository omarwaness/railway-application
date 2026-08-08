import Link from "next/link"

import { cn } from "@/lib/utils"
import type { Project } from "@/lib/api/projects"

const MAX_ICONS = 5

const PROJECT_GRID_CLASSNAME =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"

type ProjectView = "grid" | "list"

function ProjectCard({
  project,
  view = "grid",
}: {
  project: Project
  view?: ProjectView
}) {
  // Deleted services come back with the rest, and only the first few get a tile.
  const services = project.services.filter(({ deletedAt }) => !deletedAt)
  const shown = services.slice(0, MAX_ICONS)
  const overflow = services.length - shown.length

  const description = project.description?.trim()
  const isList = view === "list"

  const heading = (
    <div className="flex min-w-0 flex-col gap-1">
      <h2 className="truncate text-sm font-semibold">{project.name}</h2>
      <p
        className={cn(
          "truncate text-sm text-muted-foreground",
          !description && "italic"
        )}
      >
        {description || "No description"}
      </p>
    </div>
  )

  const count = (
    <p className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          services.length > 0 ? "bg-emerald-500" : "bg-muted-foreground/40"
        )}
      />
      {services.length} {services.length === 1 ? "service" : "services"}
    </p>
  )

  return (
    <Link
      href={`/project/${project.id}`}
      className={cn(
        "rounded-xl border bg-card transition-colors outline-none hover:border-ring/40 hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        isList
          ? "flex items-center justify-between gap-4 px-4 py-3"
          : "flex flex-col gap-3 p-4"
      )}
    >
      {heading}

      {!isList && (
        <div className="flex h-40 items-center justify-center gap-2 rounded-lg border bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[10px_10px] p-4">
          {services.length === 0 && (
            <p className="text-xs text-muted-foreground">No services yet</p>
          )}

          {shown.map((service) => (
            <div
              key={service.id}
              title={service.name}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-card"
            >
              {service.icon ? (
                // Plain `img`: these URLs are whatever Railway stored, and
                // `next/image` would need every possible host allow-listed.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.icon} alt="" aria-hidden className="size-5" />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {service.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="sr-only">{service.name}</span>
            </div>
          ))}

          {overflow > 0 && (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-card text-xs font-medium text-muted-foreground">
              +{overflow}
            </div>
          )}
        </div>
      )}

      {count}
    </Link>
  )
}

export { ProjectCard, PROJECT_GRID_CLASSNAME }
export type { ProjectView }
