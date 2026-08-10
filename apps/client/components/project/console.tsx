"use client"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

type LogLine = {
  timestamp: string
  message: string
  severity?: string | null
}

const time = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
  hour12: false,
})

const SEVERITY: Record<string, string> = {
  fatal: "text-destructive",
  critical: "text-destructive",
  error: "text-destructive",
  err: "text-destructive",
  warning: "text-amber-600 dark:text-amber-400",
  warn: "text-amber-600 dark:text-amber-400",
  info: "text-foreground",
  debug: "text-muted-foreground",
  trace: "text-muted-foreground",
}

/** Plain foreground for info and for anything Railway sends that isn't listed. */
function severityClass(severity: string | null | undefined) {
  return SEVERITY[severity?.trim().toLowerCase() ?? ""] ?? "text-foreground"
}

const consoleSurface =
  "rounded-lg border bg-background/70 [&>[data-slot=scroll-area-viewport]]:max-h-80"

function Console({ logs, className }: { logs: LogLine[]; className?: string }) {
  return (
    <ScrollArea className={cn(consoleSurface, className)}>
      <div role="log" className="p-3 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">No logs</p>
        ) : (
          <ol className="flex flex-col gap-0.5">
            {logs.map((line, index) => (
              <li key={`${line.timestamp}-${index}`} className="flex gap-3">
                <time
                  dateTime={line.timestamp}
                  className="shrink-0 text-muted-foreground tabular-nums"
                >
                  {time.format(new Date(line.timestamp))}
                </time>

                <span
                  className={cn(
                    "min-w-0 break-words whitespace-pre-wrap",
                    severityClass(line.severity)
                  )}
                >
                  {line.message}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </ScrollArea>
  )
}

export { Console, consoleSurface }
export type { LogLine }
