import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const variants = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "success",
  "link",
] as const

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <ThemeToggle />
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size="lg">
                {variant}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Input placeholder="Email" />
        </div>
      </div>
    </div>
  )
}
