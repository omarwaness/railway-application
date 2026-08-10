"use client"

import { cn } from "@/lib/utils"
import type { EnvironmentService } from "@/lib/api/projects"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServiceDeployment } from "@/components/project/service-deployment"
import { ServiceVariables } from "@/components/project/service-variables"
import { ServiceSettings } from "@/components/project/service-settings"

function ServiceDrawer({
  service,
  projectId,
  environmentId,
  open,
  onOpenChange,
}: {
  service: EnvironmentService | null
  projectId: string
  /** The environment the canvas is showing. Absent on a project with none. */
  environmentId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection="right"
      showSwipeHandle
    >
      <DrawerContent
        className={cn(
          "data-[swipe-axis=x]:sm:[--drawer-content-width:48rem]",
          "rounded-xl border [--drawer-inset:0.75rem]",
          "[--drawer-bleed-background:transparent]"
        )}
      >
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-background">
              {service?.service.icon ? (
                // Plain `img`: these URLs are whatever Railway stored, and
                // `next/image` would need every possible host allow-listed.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={service.service.icon}
                  alt=""
                  aria-hidden
                  className="size-6"
                />
              ) : (
                <span className="text-xl font-medium text-muted-foreground">
                  {service?.serviceName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <DrawerTitle className="min-w-0 truncate text-2xl">
              {service?.serviceName}
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <Tabs
          key={service?.id}
          defaultValue="deployments"
          className="min-h-0 flex-1 gap-4 p-4"
        >
          <TabsList
            variant="line"
            className="**:data-[slot=tabs-trigger]:text-base **:data-[slot=tabs-trigger]:font-normal"
          >
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <ScrollArea className="min-h-0 flex-1">
            <TabsContent value="deployments">
              <ServiceDeployment
                service={service}
                projectId={projectId}
                environmentId={environmentId}
              />
            </TabsContent>

            <TabsContent value="variables">
              <ServiceVariables
                service={service}
                projectId={projectId}
                environmentId={environmentId}
              />
            </TabsContent>

            <TabsContent value="settings">
              <ServiceSettings
                service={service}
                projectId={projectId}
                environmentId={environmentId}
                onDeleted={() => onOpenChange(false)}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DrawerContent>
    </Drawer>
  )
}

export { ServiceDrawer }
