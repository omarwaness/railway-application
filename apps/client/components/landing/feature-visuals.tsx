"use client"

import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/ease"

function usePlayback() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion() ?? false
  const inView = useInView(ref, { amount: 0.4 })

  return { ref, play: inView && !reduce }
}

/**
 * The stage each visual draws into. No background of its own — it inherits the
 * card's, so the animation reads as part of the card rather than a panel set
 * into it. `mt-auto` pins it to the bottom, which keeps the three animations
 * on a common baseline when one description wraps to a second line.
 */
function Frame({
  children,
  ref,
}: {
  children: React.ReactNode
  ref: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={ref}
      aria-hidden
      className="mt-auto mb-4 flex h-40 w-full items-center justify-center overflow-hidden"
    >
      {children}
    </div>
  )
}

/* ---------------------------------------------------------------- Mapped -- */

// Four services wired into a diamond: one in, two in parallel, one out.
const NODES = [
  { x: 14, y: 42 },
  { x: 92, y: 12 },
  { x: 92, y: 72 },
  { x: 170, y: 42 },
]

const EDGES = [
  "M70 56C81 56 81 26 92 26",
  "M70 56C81 56 81 86 92 86",
  "M148 26C159 26 159 56 170 56",
  "M148 86C159 86 159 56 170 56",
]

function MappedVisual() {
  const { ref, play } = usePlayback()

  return (
    <Frame ref={ref}>
      <svg
        viewBox="0 0 240 112"
        fill="none"
        className="h-full w-full max-w-[280px] px-6"
      >
        {EDGES.map((d, i) => (
          <g key={d}>
            <motion.path
              d={d}
              className="stroke-border"
              strokeWidth={1.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: play ? 1 : 0 }}
              transition={{
                duration: 0.5,
                delay: 0.5 + i * 0.1,
                ease: EASE_OUT,
              }}
            />
            <motion.path
              d={d}
              className="stroke-primary"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="6 46"
              initial={{ strokeDashoffset: 52 }}
              animate={{ strokeDashoffset: play ? -6 : 52 }}
              transition={{
                duration: 1.6,
                delay: i * 0.35,
                repeat: Infinity,
                repeatDelay: 0.9,
                ease: "linear",
              }}
            />
          </g>
        ))}

        {NODES.map(({ x, y }, i) => (
          <motion.g
            key={`${x}-${y}`}
            initial={{ opacity: 0, y: 6 }}
            animate={play ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.45, delay: i * 0.1, ease: EASE_OUT }}
          >
            <rect
              x={x}
              y={y}
              width={56}
              height={28}
              rx={8}
              className="fill-background stroke-border"
              strokeWidth={1.5}
            />
            <circle cx={x + 13} cy={y + 14} r={3} className="fill-primary" />
            <rect
              x={x + 22}
              y={y + 12}
              width={22}
              height={4}
              rx={2}
              className="fill-border"
            />
          </motion.g>
        ))}
      </svg>
    </Frame>
  )
}

/* --------------------------------------------------------------- Shipped -- */

const STAGES = ["Build", "Deploy", "Live"]

// One shared cycle length, so the fill and the three dots stay locked to each
// other. Each dot lights at the fraction of the run where the fill reaches it.
const SHIP_CYCLE = 4.4
const STAGE_AT = [0.05, 0.37, 0.66]

/**
 * A deploy running end to end. Everything is keyframed against one duration
 * with `times` rather than chained delays — a rewind at the end of the loop
 * would read as the bar running backwards, so it fades instead.
 */
function ShippedVisual() {
  const { ref, play } = usePlayback()

  const loop = {
    duration: SHIP_CYCLE,
    repeat: Infinity,
    ease: EASE_OUT,
  } as const

  return (
    <Frame ref={ref}>
      <div className="w-full px-10">
        <div className="relative flex items-center justify-between">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          <motion.div
            className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-primary"
            initial={{ width: "0%", opacity: 0 }}
            animate={
              play
                ? {
                    width: ["0%", "0%", "100%", "100%", "100%"],
                    opacity: [0, 1, 1, 1, 0],
                  }
                : { width: "100%", opacity: 1 }
            }
            transition={{ ...loop, times: [0, 0.05, 0.68, 0.9, 1] }}
          />

          {STAGES.map((stage, i) => (
            <div
              key={stage}
              // The ring is what punches the connector line out from behind
              // each dot, so it has to match whatever the card is painted.
              className="relative z-10 size-3 rounded-full bg-muted ring-4 ring-card"
            >
              <motion.span
                className="absolute inset-0 rounded-full bg-primary"
                initial={{ opacity: 0 }}
                animate={play ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }}
                transition={{
                  ...loop,
                  times: [0, STAGE_AT[i], STAGE_AT[i] + 0.06, 0.9, 1],
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-between">
          {STAGES.map((stage, i) => (
            <motion.span
              key={stage}
              className="text-xs font-medium text-muted-foreground"
              initial={{ opacity: 0.35 }}
              animate={
                play ? { opacity: [0.35, 0.35, 1, 1, 0.35] } : { opacity: 1 }
              }
              transition={{
                ...loop,
                times: [0, STAGE_AT[i], STAGE_AT[i] + 0.06, 0.9, 1],
              }}
            >
              {stage}
            </motion.span>
          ))}
        </div>
      </div>
    </Frame>
  )
}

/* ----------------------------------------------------------------- Wired -- */

// Widths differ per row so the filled bars read as values of their own length
// rather than one repeated shape.
const VARIABLES = [
  { key: "DATABASE_URL", width: "w-[72%]" },
  { key: "PORT", width: "w-[38%]" },
  { key: "NODE_ENV", width: "w-[54%]" },
]

const WIRE_CYCLE = 4.2

/** Variables landing in an environment, one row at a time. */
function WiredVisual() {
  const { ref, play } = usePlayback()

  const loop = {
    duration: WIRE_CYCLE,
    repeat: Infinity,
    ease: EASE_OUT,
  } as const

  return (
    <Frame ref={ref}>
      <div className="flex w-full flex-col gap-3 px-8">
        {VARIABLES.map(({ key, width }, i) => {
          const at = 0.06 + i * 0.1

          return (
            <motion.div
              key={key}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -8 }}
              animate={
                play
                  ? { opacity: [0, 0, 1, 1, 0], x: [-8, -8, 0, 0, 0] }
                  : { opacity: 1, x: 0 }
              }
              transition={{ ...loop, times: [0, at, at + 0.08, 0.88, 1] }}
            >
              <span className="font-mono text-[11px] text-muted-foreground">
                {key}
              </span>
              <div
                className={`h-2 overflow-hidden rounded-full bg-muted ${width}`}
              >
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={
                    play
                      ? { width: ["0%", "0%", "100%", "100%", "100%"] }
                      : { width: "100%" }
                  }
                  transition={{
                    ...loop,
                    times: [0, at + 0.06, at + 0.3, 0.88, 1],
                  }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </Frame>
  )
}

export { MappedVisual, ShippedVisual, WiredVisual }
