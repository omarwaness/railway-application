import { RequireSession } from "@/components/auth/require-session"
import { TokenOnboarding } from "@/components/onboarding/token-onboarding"

export default function Page() {
  return (
    <RequireSession>
      <TokenOnboarding />
    </RequireSession>
  )
}
