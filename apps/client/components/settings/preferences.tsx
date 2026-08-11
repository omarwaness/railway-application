"use client"

import { useSyncExternalStore } from "react"
import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field"
import { SectionHeader } from "@/components/settings/section-header"

const THEMES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
]

/** How the app looks. Stored per browser by next-themes, not on the account. */
function PreferencesSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Preferences"
        description="How the app looks in this browser."
      />

      <FieldGroup className="gap-4">
        <Field orientation="horizontal" className="items-center">
          <FieldContent>
            <FieldTitle>Theme</FieldTitle>
            <FieldDescription>
              System follows whatever your operating system is set to.
            </FieldDescription>
          </FieldContent>

          <ThemeChoice />
        </Field>
      </FieldGroup>
    </section>
  )
}

const noopSubscribe = () => () => {}

function ThemeChoice() {
  const { theme, setTheme } = useTheme()
  // The stored theme lives in localStorage, which the server can't read — so
  // marking a selection in the prerender would mark the wrong one and mismatch
  // on hydration. Until the client takes over, nothing is marked.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex shrink-0 items-center gap-1 rounded-lg border bg-muted/40 p-1 dark:bg-muted/20"
    >
      {THEMES.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value

        return (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="sm"
            // Says the same thing the fill does, for anyone not seeing the fill.
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "gap-2 text-muted-foreground hover:bg-background/60",
              active && "bg-background text-foreground shadow-sm"
            )}
          >
            <Icon />
            {label}
          </Button>
        )
      })}
    </div>
  )
}

export { PreferencesSection }
