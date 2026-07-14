"use client"

import { useState } from "react"
import Image from "next/image"
import { UserButton } from "@clerk/nextjs"
import type { Role } from "@prisma/client"
import { Menu } from "lucide-react"

import { NavLinks } from "@/components/layout/nav-links"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Topbar({ role, name }: { role: Role; name: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:justify-end">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <SheetHeader className="p-0 pb-4">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg" />
                LUMIQ Tournaments
              </SheetTitle>
            </SheetHeader>
            <NavLinks role={role} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold">LUMIQ Tournaments</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  )
}
