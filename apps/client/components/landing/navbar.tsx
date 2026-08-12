"use client"

import Link from "next/link"
import * as React from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Hash targets are the section ids on the landing page. The scroll itself is
// native: `scroll-behavior` and `scroll-padding-top` are set on `html`, which
// keeps the landing below the sticky bar instead of under it.
const SECTIONS = [
  { label: "Features", href: "#features" },
  { label: "Platform", href: "#platform" },
  { label: "Showcase", href: "#showcase" },
  { label: "Reviews", href: "#reviews" },
]

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 0)
    }

    // Run once up front: a reload can restore a scroll position partway down
    // the page without ever firing a scroll event.
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        // The border is always there, just transparent at the top, so the
        // content below does not shift by a pixel when it fades in.
        "sticky top-0 z-50 border-b border-transparent bg-background transition-colors",
        scrolled && "border-border"
      )}
    >
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center px-4">
        <Link
          href="/"
          aria-label="Railway"
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {/* Placeholder mark — swap in the real logo when there is one. */}
          <span aria-hidden className="size-7 rounded-full bg-primary" />
          <span className="text-sm font-semibold">Railway</span>
        </Link>

        <div className="ml-8 hidden items-center gap-1 md:flex">
          {SECTIONS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "font-normal text-muted-foreground",
              })}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/auth/login"
            className={buttonVariants({ variant: "ghost" })}
          >
            Log in
          </Link>
          <Link href="/auth/signup" className={buttonVariants()}>
            Get started
          </Link>
        </div>
      </nav>
    </header>
  )
}

export { Navbar }
