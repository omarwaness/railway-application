import { Marquee } from "@/components/motion/marquee"

// Placeholder copy — swap these for real, attributed quotes before launch.
const REVIEWS: { name: string; role: string; quote: string }[] = [
  {
    name: "Avery Lin",
    role: "Staff Engineer",
    quote:
      "We moved four services over in an afternoon. The canvas is the first deploy tool my whole team actually opens on purpose.",
  },
  {
    name: "Jordan Okafor",
    role: "Founder",
    quote:
      "Push, watch the logs, done. I stopped keeping a runbook because there was nothing left in it.",
  },
  {
    name: "Sam Iyer",
    role: "Platform Lead",
    quote:
      "Private networking that just works between services saved us an entire sprint of config we had budgeted for.",
  },
  {
    name: "Riley Chen",
    role: "Backend Engineer",
    quote:
      "Rolling back used to be a group activity. Now it is one click and a message in the channel afterwards.",
  },
  {
    name: "Micah Torres",
    role: "CTO",
    quote:
      "Metrics and logs on the same screen means we find the cause before the incident channel has finished filling up.",
  },
  {
    name: "Dana Whitfield",
    role: "Infrastructure Engineer",
    quote:
      "It scaled through our launch week without anyone touching a dashboard. That is the highest praise I have.",
  },
  {
    name: "Noor Haddad",
    role: "Product Engineer",
    quote:
      "Environments used to be the thing nobody wanted to own. Now they take about a minute to spin up.",
  },
  {
    name: "Elliot Vance",
    role: "Engineering Manager",
    quote:
      "Onboarding a new hire to our stack is now a five minute tour of one page instead of a half day of context.",
  },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
}

function ReviewCard({ name, role, quote }: (typeof REVIEWS)[number]) {
  return (
    <figure className="flex h-full w-80 flex-col gap-4 rounded-sm bg-card p-6">
      <figcaption className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
        >
          {initials(name)}
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{role}</span>
        </span>
      </figcaption>
      <blockquote className="text-sm text-pretty text-muted-foreground">
        &ldquo;{quote}&rdquo;
      </blockquote>
    </figure>
  )
}

/**
 * Two rows running opposite ways at slightly different speeds, so the pair
 * never lines up into one block sliding across the page. The rows are split
 * down the middle rather than repeating the same set twice.
 */
function Reviews() {
  const half = Math.ceil(REVIEWS.length / 2)

  return (
    <section id="reviews" className="w-full py-20 sm:py-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">
          What people are saying
        </h2>
        <p className="max-w-xl text-pretty text-muted-foreground">
          From the teams shipping on it every day.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <Marquee speed={60} gap="1rem">
          {REVIEWS.slice(0, half).map((review) => (
            <ReviewCard key={review.name} {...review} />
          ))}
        </Marquee>
        <Marquee direction="right" speed={72} gap="1rem">
          {REVIEWS.slice(half).map((review) => (
            <ReviewCard key={review.name} {...review} />
          ))}
        </Marquee>
      </div>
    </section>
  )
}

export { Reviews }
