import Image from "next/image"
import Link from "next/link"

// The product column points at the sections on this page; the rest are
// placeholders until there are real pages behind them.
const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Platform", href: "#platform" },
        { label: "Showcase", href: "#showcase" },
        { label: "Reviews", href: "#reviews" },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "Log in", href: "/auth/login" },
        { label: "Get started", href: "/auth/signup" },
      ],
    },
    {
      heading: "Resources",
      links: [
        { label: "Docs", href: "#" },
        { label: "Changelog", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
  ]

/**
 * The scrim over the artwork is what lets the content use the ordinary theme
 * tokens: it tints toward white in light mode and toward black in dark, so
 * whichever way `foreground` resolves, it lands on a backdrop it contrasts
 * against. Both ramps thicken downward, where the small print sits.
 */
function Footer() {
  return (
    <footer className="relative isolate overflow-hidden">
      <Image
        src="/footer-image.png"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        // A square source cropped to a wide band. Pulling the crop above center
        // frames the peak, with sky over it and the slope running out below.
        className="-z-10 object-cover object-[50%_42%]"
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-white/60 via-white/76 to-white/88 dark:from-black/50 dark:via-black/68 dark:to-black/88"
      />

      {/* Dissolves the top edge into whatever the page above is painted, in
          place of a hard seam. Shorter than the content's top padding, so no
          white-on-white text in light mode. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-36 bg-linear-to-b from-background to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl px-4 pt-40 pb-20">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 flex flex-col gap-3">
            <Link
              href="/"
              aria-label="Railway"
              className="flex w-fit items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {/* Placeholder mark — swap in the real logo when there is one. */}
              <span aria-hidden className="size-7 rounded-full bg-primary" />
              <span className="text-sm font-semibold">Railway</span>
            </Link>
            <p className="max-w-xs text-sm text-pretty text-muted-foreground">
              One screen for everything you have running in production.
            </p>
          </div>

          {COLUMNS.map(({ heading, links }) => (
            <nav key={heading} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium">{heading}</h2>
              <ul className="flex flex-col gap-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 border-t pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Railway. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
