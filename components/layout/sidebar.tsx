import Image from "next/image"
import type { Role } from "@prisma/client"

import { NavLinks } from "@/components/layout/nav-links"

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/70 p-4 backdrop-blur-xl md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg" />
        <span className="font-heading text-lg font-semibold tracking-tight">
          LUMIQ Tournaments
        </span>
      </div>
      <NavLinks role={role} />
    </aside>
  )
}
