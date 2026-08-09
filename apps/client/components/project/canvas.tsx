"use client"

import { useMemo } from "react"
import { useTheme } from "next-themes"
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import type { EnvironmentService, ProjectOverview } from "@/lib/api/projects"
import { ServiceNode, type ServiceNodeType } from "@/components/project/node"

// Outside the component: React Flow warns when this object changes identity.
const nodeTypes = { service: ServiceNode }

const COLUMNS = 3
const COLUMN_GAP = 280
const ROW_GAP = 130

function ProjectCanvas({
  overview,
  onServiceSelect,
}: {
  overview: ProjectOverview
  onServiceSelect?: (service: EnvironmentService) => void
}) {
  const { resolvedTheme } = useTheme()
  const services = overview.primaryEnvironment?.services

  // Positions are laid out on a fixed grid and nodes stay undraggable — Railway
  // stores canvas positions server-side, and local drag state would be thrown
  // away by the next refetch anyway.
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

  const handleNodeClick: NodeMouseHandler<ServiceNodeType> = (_, node) =>
    onServiceSelect?.(node.data.service)

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
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--color-border)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>

      {nodes.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          No services yet
        </p>
      )}
    </div>
  )
}

export { ProjectCanvas }
