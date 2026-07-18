import { SignIn } from "@clerk/nextjs"

import { safeRedirectPath } from "@/lib/utils"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>
}) {
  const { redirect_url } = await searchParams
  const redirectTo = safeRedirectPath(redirect_url)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignIn
        {...(redirectTo ? { fallbackRedirectUrl: redirectTo } : {})}
        appearance={{
          elements: {
            card: "rounded-2xl shadow-sm",
            formButtonPrimary: "bg-primary hover:bg-primary/80 text-primary-foreground",
          },
        }}
      />
    </div>
  )
}
