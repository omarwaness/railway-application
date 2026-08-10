"use client"

import { cn } from "@/lib/utils"
import type { EnvironmentService } from "@/lib/api/projects"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
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
          <DrawerTitle>{service?.serviceName}</DrawerTitle>
          <DrawerDescription>{service?.serviceId}</DrawerDescription>
        </DrawerHeader>

        {/* Keyed on the service so switching nodes without closing the drawer
            drops back to the first tab rather than keeping the last one. */}
        <Tabs
          key={service?.id}
          defaultValue="deployment"
          className="min-h-0 flex-1 gap-4 p-4"
        >
          <TabsList variant="line">
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <ScrollArea className="min-h-0 flex-1">
            <TabsContent value="deployment">
              <ServiceDeployment service={service} />
            </TabsContent>

            <TabsContent value="variables">
              <ServiceVariables
                service={service}
                projectId={projectId}
                environmentId={environmentId}
              />
            </TabsContent>

            <TabsContent value="settings">
              <ServiceSettings service={service} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DrawerContent>
    </Drawer>
  )
}

export { ServiceDrawer }
