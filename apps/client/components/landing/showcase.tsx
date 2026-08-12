import Image from "next/image"

import { cn } from "@/lib/utils"

function Screenshot({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div className={cn("absolute inset-0", className)}>
      {/* Bleeds past the edges so the blur radius has pixels to pull from
          instead of fading into nothing. */}
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="(min-width: 1280px) 1280px, 100vw"
        className="scale-110 object-cover blur-[7px]"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1280px) 1280px, 100vw"
        className="[mask-image:radial-gradient(ellipse_55%_55%_at_50%_50%,black_30%,transparent_100%)] object-cover"
      />
    </div>
  )
}

function Showcase() {
  return (
    <section
      id="showcase"
      className="mx-auto w-full max-w-7xl px-4 py-20 sm:py-24"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
        <h2 className="max-w-sm text-4xl font-semibold tracking-tight text-balance">
          Know your whole stack
        </h2>
        <p className="max-w-md text-pretty text-muted-foreground">
          Services, databases, and what each one is doing right now, laid out on
          a single canvas. The view every deploy needs before it goes out.
        </p>
      </div>

      {/* The masks fade each capture into whatever is behind it, so the frame
          has to sit on the capture's own background value: the card value in
          each theme, which the two screenshots were taken against. */}
      <div className="mt-10 aspect-4/3 overflow-hidden rounded-2xl bg-[oklch(0.975_0.005_303)] sm:aspect-video lg:aspect-2/1 dark:bg-[oklch(0.19_0.014_303)]">
        <div className="size-full [perspective:1400px]">
          <div className="relative size-full [transform:rotateX(9deg)_rotateY(-16deg)_rotateZ(-11deg)_scale(1.3)] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)] sm:[transform:rotateX(9deg)_rotateY(-16deg)_rotateZ(-11deg)_scale(1.55)]">
            <Screenshot
              src="/screenshot-light.png"
              alt="The Railway project canvas, showing a Node.js service and a Postgres database side by side, both running."
              className="dark:hidden"
            />
            <Screenshot
              src="/screenshot.png"
              alt=""
              className="hidden dark:block"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export { Showcase }
