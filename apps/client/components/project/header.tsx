"use client"

import Link from "next/link"
import { BoltIcon, ChevronsUpDownIcon, LayoutGridIcon } from "lucide-react"

import type { ProjectOverview } from "@/lib/api/projects"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** Which body sits under the header. Both project routes share everything above it. */
type ProjectViewName = "canvas" | "settings"

function ProjectHeader({
  overview,
  environmentId,
  onEnvironmentChange,
  view,
}: {
  overview: ProjectOverview
  /** The environment the page is showing. Absent on a project with none. */
  environmentId?: string
  onEnvironmentChange: (environmentId: string) => void
  /** Which of the two project routes is rendering this. */
  view: ProjectViewName
}) {
  const { project, environments } = overview
  const active = environments.find((env) => env.id === environmentId)

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

      <div className="flex min-w-0 items-center gap-1 text-sm">
        <Link
          href={`/project/${project.id}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "min-w-0 font-medium",
          })}
        >
          <span className="truncate">{project.name}</span>
        </Link>

        {active && (
          <>
            <span aria-hidden className="text-muted-foreground">
              /
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Environment: ${active.name}`}
                    className="min-w-0"
                  >
                    <span className="truncate">{active.name}</span>
                    <ChevronsUpDownIcon
                      data-icon="inline-end"
                      className="text-muted-foreground"
                    />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-48 min-w-48">
                <DropdownMenuRadioGroup
                  value={active.id}
                  onValueChange={(value) => onEnvironmentChange(value)}
                >
                  {environments.map((environment) => (
                    <DropdownMenuRadioItem
                      key={environment.id}
                      value={environment.id}
                    >
                      <span className="truncate">{environment.name}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={`/project/${project.id}/settings`}
              aria-label="Project settings"
              // `aria-current` doubles as the styling hook, so the bolt reads
              // as active on the settings route without a second flag.
              aria-current={view === "settings" ? "page" : undefined}
              className={buttonVariants({
                variant: "ghost",
                size: "icon-sm",
                className: "ml-auto aria-[current=page]:bg-muted",
              })}
            >
              <BoltIcon />
            </Link>
          }
        />
        <TooltipContent side="bottom">Project settings</TooltipContent>
      </Tooltip>
    </header>
  )
}

export { ProjectHeader }
export type { ProjectViewName }
