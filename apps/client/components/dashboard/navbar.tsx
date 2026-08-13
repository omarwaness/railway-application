"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGridIcon,
  SettingsIcon,
  TrainFrontIcon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { CurrentUser } from "@/components/auth/current-user"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Projects", icon: LayoutGridIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
]

function Navbar() {
  const pathname = usePathname()

  const activeHref = links
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.href.length - a.href.length)
    .at(0)?.href

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-1 px-4">
        <Link
          href="/dashboard"
          aria-label="Railway Application"
          className="mr-3 flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {/* `text-foreground`, not `text-white`: this bar has the theme
              toggle in it, so it is as often light as dark. */}
          <TrainFrontIcon aria-hidden className="size-6 text-foreground" />
        </Link>

        <Separator
          orientation="vertical"
          className="mr-3 h-6 data-vertical:self-center"
        />

        {links.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref

          return (
            <Link
              key={href}
              href={href}
              // Communicates the same thing the styling does, for anyone not
              // reading the styling.
              aria-current={active ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "gap-2 text-muted-foreground",
                active && "bg-muted text-foreground"
              )}
            >
              <Icon className={cn(active && "text-primary")} />
              {label}
            </Link>
          )
        })}

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Separator
            orientation="vertical"
            className="h-6 data-vertical:self-center"
          />
          <CurrentUser />
        </div>
      </nav>
    </header>
  )
}

export { Navbar }
