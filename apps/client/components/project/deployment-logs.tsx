"use client"

import { useQuery } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import {
  buildLogsQueryOptions,
  runtimeLogsQueryOptions,
  httpLogsQueryOptions,
} from "@/lib/api/deployments"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Console,
  consoleSurface,
  type LogLine,
} from "@/components/project/console"

function DeploymentLogs({ deploymentId }: { deploymentId: string }) {
  return (
    <Tabs defaultValue="build" className="gap-3">
      <TabsList variant="line">
        <TabsTrigger value="build">Build logs</TabsTrigger>
        <TabsTrigger value="runtime">Runtime logs</TabsTrigger>
        <TabsTrigger value="http">HTTP logs</TabsTrigger>
      </TabsList>

      <TabsContent value="build">
        <BuildLogs deploymentId={deploymentId} />
      </TabsContent>

      <TabsContent value="runtime">
        <RuntimeLogs deploymentId={deploymentId} />
      </TabsContent>

      <TabsContent value="http">
        <HttpLogs deploymentId={deploymentId} />
      </TabsContent>
    </Tabs>
  )
}

function BuildLogs({ deploymentId }: { deploymentId: string }) {
  const { data, isPending, error } = useQuery(
    buildLogsQueryOptions(deploymentId)
  )

  return <LogStream logs={data?.logs} isPending={isPending} error={error} />
}

function RuntimeLogs({ deploymentId }: { deploymentId: string }) {
  const { data, isPending, error } = useQuery(
    runtimeLogsQueryOptions(deploymentId)
  )

  return <LogStream logs={data?.logs} isPending={isPending} error={error} />
}

function LogStream({
  logs,
  isPending,
  error,
}: {
  logs: LogLine[] | undefined
  isPending: boolean
  error: Error | null
}) {
  if (isPending) {
    return <LogSkeleton />
  }

  if (error) {
    return <LogError message={error.message} />
  }

  // An empty stream is a normal answer, and `Console` says so itself.
  return <Console logs={logs ?? []} />
}

const httpTime = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

/** Red on a server error, amber on a client one, plain on anything that worked. */
function statusClass(httpStatus: number) {
  if (httpStatus >= 500) {
    return "text-destructive"
  }

  if (httpStatus >= 400) {
    return "text-amber-600 dark:text-amber-400"
  }

  return "text-foreground"
}

function HttpLogs({ deploymentId }: { deploymentId: string }) {
  const { data, isPending, error } = useQuery(
    httpLogsQueryOptions(deploymentId)
  )

  if (isPending) {
    return <LogSkeleton />
  }

  if (error) {
    return <LogError message={error.message} />
  }

  return (
    <ScrollArea className={consoleSurface}>
      <div className="p-3 font-mono text-xs">
        {data.logs.length === 0 ? (
          // Expected for a deployment with no domain — nothing reaches the edge.
          <p className="py-6 text-center text-muted-foreground">
            No requests recorded
          </p>
        ) : (
          <ol className="flex flex-col gap-0.5">
            {data.logs.map((request) => (
              <li key={request.requestId} className="flex items-baseline gap-3">
                <time
                  dateTime={request.timestamp}
                  className="shrink-0 text-muted-foreground tabular-nums"
                >
                  {httpTime.format(new Date(request.timestamp))}
                </time>

                <span
                  className={cn(
                    "w-8 shrink-0",
                    statusClass(request.httpStatus)
                  )}
                >
                  {request.httpStatus}
                </span>

                <span className="w-12 shrink-0 text-muted-foreground">
                  {request.method}
                </span>

                <span className="min-w-0 flex-1 truncate">{request.path}</span>

                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {Math.round(request.totalDuration)}ms
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </ScrollArea>
  )
}

function LogSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading logs"
      className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3"
    >
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

function LogError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/30 bg-muted/40 p-3 text-xs text-destructive"
    >
      {message}
    </p>
  )
}

export { DeploymentLogs }
