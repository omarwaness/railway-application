"use client"

import { useMemo, useState } from "react"
import { useTheme } from "next-themes"
import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useEnvironmentServices } from "@/lib/api/environments"
import type { EnvironmentService, ProjectOverview } from "@/lib/api/projects"
import { ServiceNode, type ServiceNodeType } from "@/components/project/node"
import { ServiceDrawer } from "@/components/project/service-drawer"
import { CreateServiceDialog } from "@/components/project/create-service-dialog"

// Outside the component: React Flow warns when this object changes identity.
const nodeTypes = { service: ServiceNode }

const COLUMNS = 3
const COLUMN_GAP = 280
const ROW_GAP = 140

function ProjectCanvas({
  overview,
  environmentId,
}: {
  overview: ProjectOverview
  /** The environment being drawn. Absent on a project with none. */
  environmentId?: string
}) {
  const { resolvedTheme } = useTheme()
  // The selection outlives `isDrawerOpen` on purpose — see ServiceDrawer.
  const [selected, setSelected] = useState<EnvironmentService | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const projectId = overview.project.id
  const { services, isLoading } = useEnvironmentServices(
    overview,
    environmentId
  )

  const nodes = useMemo<ServiceNodeType[]>(
    () =>
      (services ?? [])
        .filter(({ service }) => !service.deletedAt)
        .map((service, index) => ({
          id: service.id,
          type: "service",
          position: {
            x: (index % COLUMNS) * COLUMN_GAP,
            y: Math.floor(index / COLUMNS) * ROW_GAP,
          },
          data: { service },
        })),
    [services]
  )

  const handleNodeClick: NodeMouseHandler<ServiceNodeType> = (_, node) => {
    setSelected(node.data.service)
    setIsDrawerOpen(true)
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.4 }}
        minZoom={0.4}
        maxZoom={2}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background
          bgColor="var(--background)"
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
        />
        <Controls showInteractive={false} />

        <Panel position="top-right">
          <CreateServiceDialog
            projectId={projectId}
            environmentId={environmentId}
          />
        </Panel>
      </ReactFlow>

      {nodes.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {isLoading ? "Loading services…" : "No services yet"}
        </p>
      )}

      <ServiceDrawer
        service={selected}
        projectId={projectId}
        environmentId={environmentId}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}

export { ProjectCanvas }
