import Link from "next/link"
import { BoltIcon, LayoutGridIcon } from "lucide-react"

import type { ProjectOverview } from "@/lib/api/projects"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function ProjectHeader({ overview }: { overview: ProjectOverview }) {
  const { project, primaryEnvironment } = overview

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-4">
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/dashboard"
              aria-label="Back to projects"
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <LayoutGridIcon />
            </Link>
          }
        />
        <TooltipContent side="bottom">Back to projects</TooltipContent>
      </Tooltip>

      <Separator
        orientation="vertical"
        className="h-6 data-vertical:self-center"
      />

      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="truncate font-medium">{project.name}</span>

        {primaryEnvironment && (
          <>
            <span aria-hidden className="text-muted-foreground">
              /
            </span>
            <span className="truncate font-medium">
              {primaryEnvironment.name}
            </span>
          </>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Project settings"
              className="ml-auto"
            >
              <BoltIcon />
            </Button>
          }
        />
        <TooltipContent side="bottom">Project settings</TooltipContent>
      </Tooltip>
    </header>
  )
}

export { ProjectHeader }
