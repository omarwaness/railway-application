"use client"

import { useState } from "react"
import {
  BoxesIcon,
  LayersIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { ProjectOverview } from "@/lib/api/projects"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSection } from "@/components/project/settings/general"
import { ServicesSection } from "@/components/project/settings/services"
import { EnvironmentSection } from "@/components/project/settings/environments"
import { DangerSection } from "@/components/project/settings/danger"

/** The contents list, in the order it reads down the rail. */
const SECTIONS = [
  { id: "general", label: "General", icon: SlidersHorizontalIcon },
  { id: "services", label: "Services", icon: BoxesIcon },
  { id: "environments", label: "Environments", icon: LayersIcon },
  { id: "danger", label: "Danger", icon: TriangleAlertIcon },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

function ProjectSettings({
  overview,
  environmentId,
}: {
  overview: ProjectOverview
  /** The environment the header is pointed at, which Services reads. */
  environmentId?: string
}) {
  const [section, setSection] = useState<SectionId>("general")
  const { project } = overview

  return (
    // The canvas's frame, to the class — the two views swap inside the same box.
    <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
      <Tabs
        value={section}
        onValueChange={(value) => setSection(value as SectionId)}
        orientation="vertical"
        className="min-h-0 w-full gap-0"
      >
        <nav
          aria-label="Project settings"
          className="shrink-0 py-16 pr-4 pl-10 sm:w-64"
        >
          <TabsList variant="line" className="w-full gap-1 p-0">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className={cn(
                  // `flex-none`: the trigger's own `flex-1` is meant for a
                  // horizontal list, and would size these off a zero basis.
                  "h-11 flex-none justify-start gap-3 rounded-lg px-3 text-base font-normal after:hidden",
                  // Active reads off color alone — the weight stays at 400, so
                  // the label doesn't reflow as the selection moves.
                  //
                  // Important, both here and below: the `line` list variant
                  // forces `data-active:bg-transparent` from a group selector,
                  // which outranks a plain `data-active:` class.
                  "data-active:bg-primary/15! data-active:text-foreground",
                  id === "danger" &&
                    "data-active:bg-destructive/10! data-active:text-destructive"
                )}
              >
                <Icon className="size-5" />
                <span className="max-sm:sr-only">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </nav>

        <ScrollArea className="min-h-0 flex-1">
          <div className="w-full max-w-2xl px-4 py-16">
            <TabsContent value="general">
              <GeneralSection project={project} />
            </TabsContent>

            <TabsContent value="services">
              <ServicesSection
                overview={overview}
                environmentId={environmentId}
              />
            </TabsContent>

            <TabsContent value="environments">
              <EnvironmentSection overview={overview} />
            </TabsContent>

            <TabsContent value="danger">
              <DangerSection project={project} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export { ProjectSettings }
