export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col gap-1 pt-8">
      <h1 className="text-[1.75rem] leading-none font-normal">Project</h1>
      <p className="font-mono text-sm text-muted-foreground">{id}</p>
    </div>
  )
}
