"use client"

import { useQuery } from "@tanstack/react-query"

import type { EnvironmentService } from "@/lib/api/projects"
import {
  serviceVariablesQueryOptions,
  type ServiceVariableScope,
} from "@/lib/api/variables"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateVariableForm } from "@/components/project/create-variable-form"
import { VariableRow } from "@/components/project/variable-row"

function ServiceVariables({
  service,
  projectId,
  environmentId,
}: {
  service: EnvironmentService | null
  projectId: string
  environmentId?: string
}) {
  if (!service || !environmentId) {
    return null
  }

  return (
    <VariableList
      scope={{ projectId, environmentId, serviceId: service.serviceId }}
    />
  )
}

function VariableList({ scope }: { scope: ServiceVariableScope }) {
  const { data, isPending, error } = useQuery(
    serviceVariablesQueryOptions(scope)
  )

  // Object key order is insertion order — whatever upstream happened to send.
  const variables = Object.entries(data?.variables ?? {}).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <div className="flex flex-col gap-3">
      <CreateVariableForm scope={scope} />

      {isPending && (
        <div
          aria-busy
          aria-label="Loading variables"
          className="flex flex-col gap-2"
        >
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      )}

      {error && (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {error.message}
        </p>
      )}

      {data && variables.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No variables yet
        </p>
      )}

      {variables.length > 0 && (
        <ul className="flex flex-col gap-2">
          {variables.map(([name, value]) => (
            <VariableRow key={name} scope={scope} name={name} value={value} />
          ))}
        </ul>
      )}
    </div>
  )
}

export { ServiceVariables }
