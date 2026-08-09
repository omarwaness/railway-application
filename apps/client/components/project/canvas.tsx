import type { ProjectOverview } from "@/lib/api/projects"
import { ScrollArea } from "@/components/ui/scroll-area"

function ProjectCanvas({ overview }: { overview: ProjectOverview }) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-background bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[20px_20px]">
      <ScrollArea className="h-full">
        <pre className="p-6 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(overview, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  )
}

export { ProjectCanvas }
