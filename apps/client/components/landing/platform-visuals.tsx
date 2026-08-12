"use client"

import { motion, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/ease"

/**
 * Tab panels unmount while inactive, so each visual starts from its first frame
 * the moment its tab is selected. That is the whole playback gate — no in-view
 * check like the feature cards need, since a tab only plays once chosen.
 *
 * Every visual keyframes against one shared cycle with `times` instead of
 * chained delays: a rewind at the end of a loop would read as the animation
 * running backwards, so the last keyframe fades everything out instead.
 */
function useLoop(duration: number) {
  const reduce = useReducedMotion() ?? false

  return {
    play: !reduce,
    loop: {
      duration,
      repeat: reduce ? 0 : Infinity,
      ease: EASE_OUT,
    } as const,
  }
}

/** The box each visual draws into, sized so all four tabs are the same height. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="flex h-full min-h-76 w-full items-center justify-center overflow-hidden p-8"
    >
      <div className="w-full max-w-88">{children}</div>
    </div>
  )
}

/* ---------------------------------------------------------------- Deploy -- */

const DEPLOY_CYCLE = 6

const DEPLOY_STEPS = [
  { label: "Fetching source", at: 0.06 },
  { label: "Installing packages", at: 0.2 },
  { label: "Building image", at: 0.38 },
  { label: "Publishing", at: 0.56 },
]

/** A build running end to end, step by step, then going live. */
function DeployVisual() {
  const { play, loop } = useLoop(DEPLOY_CYCLE)

  return (
    <Stage>
      <div className="flex flex-col gap-4 rounded-lg border bg-background p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-muted-foreground">
            a1b2c3d · main
          </span>
          <motion.span
            className="flex items-center gap-1.5 text-[11px] font-medium"
            initial={{ opacity: 0 }}
            animate={play ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }}
            transition={{ ...loop, times: [0, 0.76, 0.82, 0.94, 1] }}
          >
            <span className="size-1.5 rounded-full bg-success" />
            Live
          </motion.span>
        </div>

        <div className="flex flex-col gap-2.5">
          {DEPLOY_STEPS.map(({ label, at }) => (
            <motion.div
              key={label}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -6 }}
              animate={
                play
                  ? { opacity: [0, 0, 1, 1, 0], x: [-6, -6, 0, 0, 0] }
                  : { opacity: 1, x: 0 }
              }
              transition={{ ...loop, times: [0, at, at + 0.06, 0.94, 1] }}
            >
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </motion.div>
          ))}
        </div>

        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={
              play
                ? { width: ["0%", "0%", "100%", "100%", "100%"] }
                : { width: "100%" }
            }
            transition={{ ...loop, times: [0, 0.06, 0.72, 0.94, 1] }}
          />
        </div>
      </div>
    </Stage>
  )
}

/* --------------------------------------------------------------- Network -- */

// A gateway on the left, a router in the middle, three services on the right.
const NETWORK_EDGES = [
  "M64 67H104",
  "M136 67C158 67 158 30 182 30",
  "M136 67H182",
  "M136 67C158 67 158 104 182 104",
]

const NETWORK_SERVICES = [16, 53, 90]

/** Traffic entering through a domain and fanning out across services. */
function NetworkVisual() {
  // The only visual without a cycle to keyframe against: the packets are
  // independent repeating tweens, so it just needs the reduced-motion gate.
  const play = !(useReducedMotion() ?? false)

  return (
    <Stage>
      <svg viewBox="0 0 240 134" fill="none" className="w-full">
        {NETWORK_EDGES.map((d, i) => (
          <g key={d}>
            <path d={d} className="stroke-border" strokeWidth={1.5} />
            <motion.path
              d={d}
              className="stroke-primary"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="5 60"
              initial={{ strokeDashoffset: 65 }}
              animate={{ strokeDashoffset: play ? -5 : 65 }}
              transition={{
                duration: 1.5,
                // The gateway hop runs first; the three fan-out legs follow it.
                delay: i === 0 ? 0 : 0.45 + (i - 1) * 0.12,
                repeat: Infinity,
                repeatDelay: 0.7,
                ease: "linear",
              }}
            />
          </g>
        ))}

        <g>
          <rect
            x={6}
            y={52}
            width={58}
            height={30}
            rx={8}
            className="fill-background stroke-border"
            strokeWidth={1.5}
          />
          <text
            x={35}
            y={71}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[9px]"
          >
            :443
          </text>
        </g>

        <circle
          cx={120}
          cy={67}
          r={16}
          className="fill-background stroke-border"
          strokeWidth={1.5}
        />
        <motion.circle
          cx={120}
          cy={67}
          r={16}
          className="stroke-primary"
          strokeWidth={1.5}
          fill="none"
          initial={{ scale: 1, opacity: 0 }}
          animate={play ? { scale: [1, 1.5], opacity: [0.6, 0] } : {}}
          style={{ transformOrigin: "120px 67px" }}
          transition={{ duration: 1.8, repeat: Infinity, ease: EASE_OUT }}
        />
        <circle cx={120} cy={67} r={4} className="fill-primary" />

        {NETWORK_SERVICES.map((y) => (
          <g key={y}>
            <rect
              x={182}
              y={y}
              width={52}
              height={28}
              rx={8}
              className="fill-background stroke-border"
              strokeWidth={1.5}
            />
            <rect
              x={194}
              y={y + 12}
              width={28}
              height={4}
              rx={2}
              className="fill-border"
            />
          </g>
        ))}
      </svg>
    </Stage>
  )
}

/* ----------------------------------------------------------------- Scale -- */

const SCALE_CYCLE = 6.5
const REPLICAS = [0, 1, 2, 3, 4, 5]

/**
 * Load climbing and falling, with replicas coming up behind it. They retire in
 * the reverse order they started, which is what makes it read as scaling down
 * rather than everything switching off at once.
 */
function ScaleVisual() {
  const { play, loop } = useLoop(SCALE_CYCLE)

  return (
    <Stage>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Load</span>
            <span className="font-mono">req/s</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "8%" }}
              animate={
                play
                  ? { width: ["8%", "8%", "94%", "94%", "8%"] }
                  : { width: "94%" }
              }
              transition={{ ...loop, times: [0, 0.04, 0.44, 0.62, 0.98] }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] text-muted-foreground">Replicas</span>
          <div className="grid grid-cols-6 gap-2">
            {REPLICAS.map((i) => {
              const on = 0.08 + i * 0.06
              const off = 0.66 + (REPLICAS.length - 1 - i) * 0.05

              return (
                <motion.div
                  key={i}
                  className="h-10 rounded-md bg-primary"
                  initial={{ opacity: 0.15 }}
                  animate={
                    play
                      ? { opacity: [0.15, 0.15, 1, 1, 0.15] }
                      : { opacity: 1 }
                  }
                  transition={{
                    ...loop,
                    times: [0, on, on + 0.05, off, off + 0.05],
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </Stage>
  )
}

/* --------------------------------------------------------------- Monitor -- */

const MONITOR_CYCLE = 7

const CHART_LINE =
  "M0 62L20 54L40 58L60 41L80 47L100 29L120 37L140 19L160 27L180 13L200 21L220 9L240 15"

const CHART_AREA = `${CHART_LINE}L240 80L0 80Z`

const LOGS = [
  { time: "12:04:31", message: "GET /api/health 200", at: 0.3 },
  { time: "12:04:33", message: "POST /api/deploy 201", at: 0.42 },
  { time: "12:04:36", message: "p95 latency 82ms", at: 0.54 },
]

/** Metrics drawing in, with the log lines behind them arriving as it goes. */
function MonitorVisual() {
  const { play, loop } = useLoop(MONITOR_CYCLE)

  return (
    <Stage>
      <div className="flex flex-col gap-5">
        <svg viewBox="0 0 240 80" fill="none" className="w-full">
          <motion.path
            d={CHART_AREA}
            className="fill-primary/15"
            initial={{ opacity: 0 }}
            animate={play ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }}
            transition={{ ...loop, times: [0, 0.16, 0.44, 0.9, 1] }}
          />
          <motion.path
            d={CHART_LINE}
            className="stroke-primary"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              play
                ? { pathLength: [0, 1, 1, 1], opacity: [1, 1, 1, 0] }
                : { pathLength: 1, opacity: 1 }
            }
            transition={{ ...loop, times: [0, 0.4, 0.9, 1] }}
          />
        </svg>

        <div className="flex flex-col gap-2">
          {LOGS.map(({ time, message, at }) => (
            <motion.div
              key={time}
              className="flex items-center gap-3 font-mono text-[11px]"
              initial={{ opacity: 0, y: 4 }}
              animate={
                play
                  ? { opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, 0] }
                  : { opacity: 1, y: 0 }
              }
              transition={{ ...loop, times: [0, at, at + 0.05, 0.9, 1] }}
            >
              <span className="text-muted-foreground/60">{time}</span>
              <span className="text-muted-foreground">{message}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </Stage>
  )
}

export { DeployVisual, MonitorVisual, NetworkVisual, ScaleVisual }
