"use client"

import { useEffect, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

/**
 * Copies a string to the clipboard and confirms it in place — the icon becomes
 * a tick for a moment rather than raising a toast, since the click and the
 * feedback are on the same control.
 *
 * `navigator.clipboard` needs a secure context, so a page served over plain
 * http has none. That's a real failure the user has to hear about, and it's the
 * one case here worth a toast.
 */
function CopyButton({
  value,
  label,
  className,
}: {
  value: string
  /** What's being copied, for the accessible name: "Copy {label}". */
  label: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      toast.add({
        type: "error",
        title: "Could not copy",
        description: "This browser blocked clipboard access.",
      })
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      className={className}
    >
      {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
    </Button>
  )
}

export { CopyButton }
