import { ProjectMain } from "@/components/project/main"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <ProjectMain projectId={id} />
}
