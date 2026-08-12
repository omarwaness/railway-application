import {
  MappedVisual,
  ShippedVisual,
  WiredVisual,
} from "@/components/landing/feature-visuals"
import { Separator } from "@/components/ui/separator"

const features: {
  title: string
  body: string
  visual: () => React.ReactNode
}[] = [
  {
    title: "Mapped",
    body: "Every service and database laid out on one interactive canvas.",
    visual: MappedVisual,
  },
  {
    title: "Shipped",
    body: "Deploy, roll back, and watch the logs stream in as it happens.",
    visual: ShippedVisual,
  },
  {
    title: "Wired",
    body: "Variables, domains, and environments without the detour.",
    visual: WiredVisual,
  },
]

function Features() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-7xl px-4 py-20 sm:py-24"
    >
      <div className="flex max-w-xl flex-col gap-3">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">
          Everything you need, one screen away
        </h2>
        <p className="text-pretty text-muted-foreground">
          A canvas for your services, live logs while they deploy, and the
          variables and domains behind them all in the same place.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ title, body, visual: Visual }) => (
          <div
            key={title}
            className="flex flex-col gap-8 rounded-sm bg-card p-8"
          >
            <h3 className="text-3xl font-semibold tracking-tight">{title}</h3>
            <Separator />
            <p className="text-xl text-pretty text-muted-foreground">{body}</p>
            <Visual />
          </div>
        ))}
      </div>
    </section>
  )
}

export { Features }
