"use client"

import { useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"

import {
  useUpsertVariable,
  type ServiceVariableScope,
} from "@/lib/api/variables"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"


function CreateVariableForm({ scope }: { scope: ServiceVariableScope }) {
  const [isAdding, setIsAdding] = useState(false)
  const upsertVariable = useUpsertVariable()

  if (!isAdding) {
    return (
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setIsAdding(true)}>
          <PlusIcon />
          New Variable
        </Button>
      </div>
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const value = String(data.get("value") ?? "")

    upsertVariable.mutate(
      { ...scope, scope: "service", name, value },
      {
        onSuccess: () => {
          setIsAdding(false)
          toast.add({
            type: "success",
            title: "Variable saved",
            description: `${name} — the service is redeploying`,
          })
        },
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Could not save variable",
            description: error.message,
          })
        },
      }
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => event.key === "Escape" && setIsAdding(false)}
      className="flex items-center gap-2"
    >
      <Input
        name="name"
        aria-label="Variable name"
        placeholder="DATABASE_URL"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        required
        autoFocus
        className="h-8 w-1/3 shrink-0 font-mono text-xs"
      />

      <Input
        name="value"
        aria-label="Variable value"
        placeholder="postgres://…"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className="h-8 min-w-0 flex-1 font-mono text-xs"
      />

      <Button type="submit" size="sm" disabled={upsertVariable.isPending}>
        {upsertVariable.isPending && <Spinner />}
        Save
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Cancel"
        onClick={() => setIsAdding(false)}
      >
        <XIcon />
      </Button>
    </form>
  )
}

export { CreateVariableForm }
