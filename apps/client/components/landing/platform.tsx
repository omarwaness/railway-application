"use client"

import Link from "next/link"
import * as React from "react"
import { ArrowRightIcon } from "lucide-react"
import { useReducedMotion } from "motion/react"

import {
  DeployVisual,
  MonitorVisual,
  NetworkVisual,
  ScaleVisual,
} from "@/components/landing/platform-visuals"
import { buttonVariants } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** Shared by the rotation timer and the progress bar under the active tab. */
const TAB_MS = 10_000

const TABS = [
  {
    value: "deploy",
    label: "Deploy",
    title: "Push, then watch it ship",
    body: "Every commit builds and rolls out on its own. Follow the build step by step, and roll back to any earlier deploy in one click.",
    visual: DeployVisual,
  },
  {
    value: "network",
    label: "Network",
    title: "Wired up on arrival",
    body: "Services reach each other over a private network the moment they exist. Attach a domain when you want one open to the world.",
    visual: NetworkVisual,
  },
  {
    value: "scale",
    label: "Scale",
    title: "Sized to the traffic",
    body: "Replicas come up as load climbs and retire as it falls. Set the ceiling once and leave the rest of it alone.",
    visual: ScaleVisual,
  },
  {
    value: "monitor",
    label: "Monitor",
    title: "Metrics and logs together",
    body: "CPU, memory, and request latency next to the log stream that explains them, so a spike and its cause sit on the same screen.",
    visual: MonitorVisual,
  },
]

function Platform() {
  const [tab, setTab] = React.useState(TABS[0].value)
  // Bumped on every click so re-picking the tab that is already active still
  // restarts the timer and replays the progress bar.
  const [cycle, setCycle] = React.useState(0)
  const reduce = useReducedMotion() ?? false

  function select(value: string) {
    setTab(value)
    setCycle((current) => current + 1)
  }

  React.useEffect(() => {
    // Content that moves on its own is exactly what reduced motion asks us to
    // stop doing, so the rotation becomes click-only.
    if (reduce) {
      return
    }

    const id = window.setTimeout(() => {
      setTab((current) => {
        const index = TABS.findIndex((entry) => entry.value === current)

        return TABS[(index + 1) % TABS.length].value
      })
    }, TAB_MS)

    return () => window.clearTimeout(id)
  }, [tab, cycle, reduce])

  return (
    <section
      id="platform"
      className="mx-auto w-full max-w-7xl px-4 py-20 sm:py-24"
    >
      <Tabs
        value={tab}
        onValueChange={(value) => select(value as string)}
        className="gap-0 overflow-hidden rounded-2xl border"
      >
        <TabsList
          variant="line"
          className="w-full justify-start gap-0 rounded-none border-b bg-card p-0 group-data-horizontal/tabs:h-auto"
        >
          {TABS.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              onClick={() => select(value)}
              // `after:hidden` drops the variant's own active underline; the
              // progress bar below is the active indicator instead.
              className="h-12 flex-none rounded-none px-5 font-mono text-xs after:hidden"
            >
              {label}
              {value === tab && (
                <span
                  // Remounting on every restart is what replays the animation.
                  key={cycle}
                  className={
                    reduce
                      ? "absolute inset-x-0 bottom-0 h-0.5 bg-foreground"
                      : "absolute inset-x-0 bottom-0 h-0.5 origin-left animate-tab-progress bg-foreground"
                  }
                  style={{ animationDuration: `${TAB_MS}ms` }}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(({ value, title, body, visual: Visual }) => (
          <TabsContent
            key={value}
            value={value}
            className="grid animate-in grid-cols-1 duration-500 fade-in lg:grid-cols-2"
          >
            <div className="flex flex-col items-start justify-center gap-4 p-8 sm:p-12">
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                {title}
              </h2>
              <p className="max-w-md text-pretty text-muted-foreground">
                {body}
              </p>
              <Link
                href="/auth/signup"
                className={buttonVariants({ className: "mt-2" })}
              >
                Get started
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </div>

            <div className="border-t bg-card lg:border-t-0 lg:border-l">
              <Visual />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

export { Platform }
