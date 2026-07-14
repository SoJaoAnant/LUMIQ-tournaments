import { clerkMiddleware } from "@clerk/nextjs/server"

// Per Clerk's current guidance, auth is enforced per-route (requireUser/requireRole
// in every page, layout, and Server Action — see lib/auth.ts) rather than via
// middleware path matching, which can drift out of sync with actual routes.
// This middleware only needs to run so `auth()`/`currentUser()` work downstream.
export default clerkMiddleware()

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
