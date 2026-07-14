import type { Role } from "@prisma/client"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Trophy,
  UserRound,
  ShieldCheck,
  Terminal,
  ListChecks,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  minRole: Role
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, minRole: "USER" },
  { label: "Tournaments", href: "/tournaments", icon: Trophy, minRole: "USER" },
  { label: "Profile", href: "/profile", icon: UserRound, minRole: "USER" },
  { label: "Admin Console", href: "/admin", icon: ShieldCheck, minRole: "ADMIN" },
  { label: "Manage Tournaments", href: "/admin/tournaments", icon: ListChecks, minRole: "ADMIN" },
  { label: "Developer Console", href: "/developer", icon: Terminal, minRole: "DEVELOPER" },
]
