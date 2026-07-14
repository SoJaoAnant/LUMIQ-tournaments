"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

export function RouteProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    function clearTimers() {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }

    function start() {
      clearTimers()
      setVisible(true)
      setProgress(15)
      intervalRef.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.15))
      }, 200)
    }

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

      start()
    }

    document.addEventListener("click", handleClick)
    return () => {
      document.removeEventListener("click", handleClick)
      clearTimers()
    }
  }, [])

  useEffect(() => {
    if (prevPathname.current === pathname) return
    prevPathname.current = pathname

    if (intervalRef.current) clearInterval(intervalRef.current)
    setProgress(100)
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 200)
  }, [pathname])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1.5">
      <div
        className="h-full bg-gradient-to-r from-primary via-[#7A7DE8] to-accent shadow-[0_0_10px_rgba(137,140,236,0.7)] transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
      />
    </div>
  )
}
