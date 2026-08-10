"use client"

import type { EnvironmentService } from "@/lib/api/projects"
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field"

function ServiceSettings({ service }: { service: EnvironmentService | null }) {
  if (!service) {
    return null
  }

  return (
    <FieldGroup className="gap-4">
      <Field orientation="horizontal">
        <FieldTitle>Name</FieldTitle>
        <span className="text-sm text-muted-foreground">
          {service.serviceName}
        </span>
      </Field>

      <Field orientation="horizontal">
        <FieldTitle>Service ID</FieldTitle>
        <span className="font-mono text-xs text-muted-foreground">
          {service.serviceId}
        </span>
      </Field>

      <Field orientation="horizontal">
        <FieldTitle>Instance ID</FieldTitle>
        <span className="font-mono text-xs text-muted-foreground">
          {service.id}
        </span>
      </Field>
    </FieldGroup>
  )
}

export { ServiceSettings }
