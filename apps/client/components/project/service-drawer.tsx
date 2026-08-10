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


function ServiceDrawer({
  service,
  open,
  onOpenChange,
}: {
  service: EnvironmentService | null
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
          // Twice the 24rem the drawer ships with, and inset off the screen
          // edges so it floats rather than sitting flush against them.
          // The variants match the primitive's own rule exactly — a bare
          // `sm:` loses to its `data-[swipe-axis=x]:sm:` on specificity.
          "data-[swipe-axis=x]:sm:[--drawer-content-width:48rem]",
          "[--drawer-inset:0.75rem] rounded-xl border",
          // The bleed paints past the popup to cover overscroll; with an inset
          // that strip lands in the gap, so it goes transparent.
          "[--drawer-bleed-background:transparent]"
        )}
      >
        <DrawerHeader>
          <DrawerTitle>{service?.serviceName}</DrawerTitle>
          <DrawerDescription>{service?.serviceId}</DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="min-h-0 flex-1">
          <pre className="p-4 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground">
            {JSON.stringify(service, null, 2)}
          </pre>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}

export { ServiceDrawer }
