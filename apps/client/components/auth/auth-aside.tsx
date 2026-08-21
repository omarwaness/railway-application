"use client"

import { ShaderBackground } from "@/components/motion/shader-background"

/**
 * The decorative half of the auth pages. Hidden below `lg`, where the form
 * takes the full width and a WebGL canvas would only cost battery.
 */
function AuthAside({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="relative hidden overflow-hidden p-3 lg:block">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#0d0b11]">
        <ShaderBackground
          variant="dithering"
          className="absolute inset-0"
          // Two colors only: the dark background token as the ground, with
          // `--primary` (#822dda) as the ink.
          colorBack="#0d0b11"
          colorFront="#822dda"
          shape="sphere"
          type="4x4"
          size={2}
          speed={0.28}
          scale={0.8}
        />

        {/* Floor for the copy — the ink runs bright enough in places that
            white text on the raw shader loses contrast. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="text-3xl font-medium tracking-[-0.03em] text-white">
            {title}
          </p>
          <p className="mt-3 max-w-sm text-pretty text-white/70">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export { AuthAside }
