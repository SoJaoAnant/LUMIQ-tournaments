"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function RouteProgressBar() {
  const pathname = usePathname()
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement)?.closest?.("a")
      if (!anchor) return
      if (anchor.hasAttribute("download") || anchor.target === "_blank") return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return

      const current = new URL(window.location.href)
      if (url.pathname === current.pathname && url.search === current.search) return

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      setState("loading")
    }

    document.addEventListener("click", handleClick)
    return () => {
      document.removeEventListener("click", handleClick)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (prevPathname.current === pathname) return
    prevPathname.current = pathname

    setState("done")
    hideTimeoutRef.current = setTimeout(() => setState("idle"), 250)
  }, [pathname])

  if (state === "idle") return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1">
      <div
        className={cn(
          "h-full bg-gradient-to-r from-primary via-[#7A7DE8] to-accent transition-[width,opacity] duration-300 ease-out",
          state === "loading" ? "w-[85%] duration-[4000ms]" : "w-full opacity-0"
        )}
      />
    </div>
  )
}
