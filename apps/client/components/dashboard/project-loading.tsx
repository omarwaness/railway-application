import { cn } from "@/lib/utils"
import { PROJECT_GRID_CLASSNAME } from "@/components/dashboard/project-card"
import { Skeleton } from "@/components/ui/skeleton"

const CARD_COUNT = 3

function ProjectLoading() {
  return (
    <div
      aria-busy
      aria-label="Loading projects"
      className="flex min-h-0 flex-1 flex-col gap-6"
    >
      {/* Stands in for the toolbar, so the count lands where it was. */}
      <Skeleton className="h-8 w-32" />

      <div className={cn(PROJECT_GRID_CLASSNAME, "min-h-0 overflow-auto")}>
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <Skeleton key={i} className="h-70 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export { ProjectLoading }
