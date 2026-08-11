import Link from "next/link"
import { TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"

function MissingTokenAlert() {
  return (
    // Full width and top of the column, the way a notice about the whole page
    // reads — not centred in the space the projects would have filled.
    <Alert variant="warning">
      <TriangleAlertIcon />
      <AlertTitle>No Railway token yet</AlertTitle>

      <AlertDescription>
        This app reads everything — projects, services, deployments, logs —
        through your own Railway API token, and there isn&apos;t one saved.
        Nothing here will load until you add it.
      </AlertDescription>

      {/* In the grid rather than in `AlertAction`, which is positioned absolutely
          against a fixed 72px of reserved padding — enough for an icon button,
          not for a labelled one. `col-start-2` keeps it out of the icon's
          column, which spans only the first two rows. */}
      <div className="col-start-2 mt-3">
        <Link
          href="/settings?section=token"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Add token
        </Link>
      </div>
    </Alert>
  )
}

export { MissingTokenAlert }
