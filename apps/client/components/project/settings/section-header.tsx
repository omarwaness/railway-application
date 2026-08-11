import { Separator } from "@/components/ui/separator"

/** The title and standfirst every settings section opens with. */
function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <h3 className="shrink-0 text-xl font-medium">{title}</h3>
        <Separator className="flex-1" />
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export { SectionHeader }
