import { Key, PaletteIcon, UserIcon, type LucideIcon } from "lucide-react"

/** The contents list, in the order it reads down the rail. */
const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "account", label: "Account", icon: UserIcon },
  { id: "preferences", label: "Preferences", icon: PaletteIcon },
  { id: "token", label: "Token", icon: Key },
]

type SectionId = "account" | "preferences" | "token"

function isSectionId(value: string | string[] | undefined): value is SectionId {
  return SECTIONS.some(({ id }) => id === value)
}

export { SECTIONS, isSectionId }
export type { SectionId }
