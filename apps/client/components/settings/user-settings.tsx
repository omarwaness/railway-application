"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SECTIONS, type SectionId } from "@/components/settings/sections"
import { AccountSection } from "@/components/settings/account"
import { PreferencesSection } from "@/components/settings/preferences"
import { TokenSection } from "@/components/settings/token"

/**
 * Which section is open is state, not a route — `initialSection` only decides
 * where it opens, so a link can point at one (`/settings?section=token`)
 * without every click of the rail becoming a navigation.
 */
function UserSettings({
  initialSection = "account",
}: {
  initialSection?: SectionId
}) {
  const [section, setSection] = useState<SectionId>(initialSection)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Tabs
        value={section}
        onValueChange={(value) => setSection(value as SectionId)}
        orientation="vertical"
        className="w-full gap-0"
      >
        <nav aria-label="Settings" className="shrink-0 pr-4 sm:w-56">
          <TabsList variant="line" className="w-full gap-1 p-0">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className={cn(
                  // `flex-none`: the trigger's own `flex-1` is meant for a
                  // horizontal list, and would size these off a zero basis.
                  "h-11 flex-none justify-start gap-3 rounded-lg px-3 text-base font-normal after:hidden",
                  "data-active:bg-primary/15! data-active:text-foreground"
                )}
              >
                <Icon className="size-5" />
                <span className="max-sm:sr-only">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </nav>

        <div className="min-w-0 flex-1 px-4">
          <TabsContent value="account">
            <AccountSection />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesSection />
          </TabsContent>

          <TabsContent value="token">
            <TokenSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export { UserSettings }
