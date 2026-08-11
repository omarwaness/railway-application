"use client"

import { useState } from "react"
import { EllipsisVerticalIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  useDeleteVariable,
  useUpsertVariable,
  type ServiceVariableScope,
} from "@/lib/api/variables"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { drawerAlignedDialog } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

function VariableRow({
  scope,
  name,
  value,
}: {
  scope: ServiceVariableScope
  name: string
  value: string
}) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <li className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <span className="w-1/3 shrink-0 truncate font-mono text-xs font-medium">
        {name}
      </span>

      {isEditing ? (
        <EditValueForm
          scope={scope}
          name={name}
          value={value}
          onDone={() => setIsEditing(false)}
        />
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
            {value}
          </span>

          <RowMenu
            scope={scope}
            name={name}
            onUpdate={() => setIsEditing(true)}
          />
        </>
      )}
    </li>
  )
}

function EditValueForm({
  scope,
  name,
  value,
  onDone,
}: {
  scope: ServiceVariableScope
  name: string
  value: string
  onDone: () => void
}) {
  const upsertVariable = useUpsertVariable()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    // Not trimmed: leading or trailing whitespace can be meaningful in a value.
    const next = String(data.get("value") ?? "")

    if (next === value) {
      onDone()
      return
    }

    upsertVariable.mutate(
      { ...scope, scope: "service", name, value: next },
      {
        // Only closes on success — a rejected write keeps the edit in place so
        // it can be corrected and submitted again.
        onSuccess: () => {
          onDone()
          toast.add({
            type: "success",
            title: "Variable updated",
            description: `${name} — the service is redeploying`,
          })
        },
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Could not update variable",
            description: error.message,
          })
        },
      }
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => event.key === "Escape" && onDone()}
      className="flex min-w-0 flex-1 items-center gap-2"
    >
      <Input
        name="value"
        aria-label={`Value for ${name}`}
        defaultValue={value}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        autoFocus
        className="h-8 min-w-0 flex-1 font-mono text-xs"
      />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onDone}
        disabled={upsertVariable.isPending}
      >
        Cancel
      </Button>

      <Button type="submit" size="sm" disabled={upsertVariable.isPending}>
        {upsertVariable.isPending && <Spinner />}
        Save
      </Button>
    </form>
  )
}

function RowMenu({
  scope,
  name,
  onUpdate,
}: {
  scope: ServiceVariableScope
  name: string
  onUpdate: () => void
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const deleteVariable = useDeleteVariable()

  function handleDelete() {
    deleteVariable.mutate(
      { ...scope, scope: "service", name },
      {
        onSuccess: () => {
          setIsConfirmingDelete(false)
          toast.add({
            type: "success",
            title: "Variable deleted",
            description: `${name} — the service is redeploying`,
          })
        },
        // Stays open on failure so the confirm can be retried.
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Could not delete variable",
            description: error.message,
          })
        },
      }
    )
  }

  return (
    <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${name}`}
            />
          }
        >
          <EllipsisVerticalIcon />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={onUpdate}>Update</DropdownMenuItem>
          {/* A menu item is a <div role="menuitem">, not a <button> — without
              this the trigger warns about losing native button semantics. */}
          <DialogTrigger
            nativeButton={false}
            render={<DropdownMenuItem variant="destructive" />}
          >
            Delete
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className={cn("sm:max-w-md", drawerAlignedDialog)}>
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>
            This removes the variable from the service and redeploys it. Nothing
            reads the old value after that.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline">
                Cancel
              </Button>
            }
          />
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteVariable.isPending}
          >
            {deleteVariable.isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { VariableRow }
