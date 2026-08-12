import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { ChromaticTextReveal } from "@/components/motion/chromatic-text-reveal"

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-size-[16px_16px]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32">
        <h1>
          <ChromaticTextReveal
            prefix="Your stack,"
            words={["mapped.", "shipped.", "watched."]}
            stacked
            startOnView={false}
            className="shrink-0 text-4xl font-medium tracking-[-0.04em] text-foreground sm:text-7xl"
          />
        </h1>

        <p className="max-w-xl text-xl text-pretty text-muted-foreground">
          One screen for everything you have running in production.
        </p>

        <Link
          href="/auth/signup"
          className={buttonVariants({ size: "lg", className: "mt-2" })}
        >
          Get started
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </div>
    </section>
  )
}

export { Hero }
