import { CylinderCarousel } from "@/components/motion/cylinder-carousel"

// `logo--switzerland-ent (1).svg` is left out on purpose: it's byte-identical
// to `logo--switzerland-ent.svg`, and the ring would visibly repeat.
const LOGOS: { src: string; name: string }[] = [
  { src: "/logo--automattic-ent.svg", name: "Automattic" },
  { src: "/logo--bilt-ent.svg", name: "Bilt" },
  { src: "/logo--chatbase-ent.svg", name: "Chatbase" },
  { src: "/logo--g2x-ent.svg", name: "G2X" },
  { src: "/logo--mercadolibre-ent.svg", name: "Mercado Libre" },
  { src: "/logo--reducto-ent.svg", name: "Reducto" },
  { src: "/logo--switzerland-ent.svg", name: "Switzerland" },
]

function Carousel() {
  return (
    // Asymmetric: the hero already carries its own bottom padding, so only the
    // top is trimmed to close the gap without crowding what follows.
    <section className="pt-2 pb-16 sm:pt-2 sm:pb-20">
      <CylinderCarousel
        variant="concave"
        itemSize={200}
        height={260}
        autoRotate
        autoRotateSpeed={0.25}
        className="mt-6 overflow-hidden"
      >
        {LOGOS.map(({ src, name }) => (
          <div
            key={src}
            className="flex size-full items-center justify-center rounded-full bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={name}
              className="h-[22%] w-[64%] object-contain brightness-0 dark:invert"
            />
          </div>
        ))}
      </CylinderCarousel>
    </section>
  )
}

export { Carousel }
