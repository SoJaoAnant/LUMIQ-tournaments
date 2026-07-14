import Image from "next/image"
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex flex-col items-center text-center">
        <Image src="/logo.png" alt="" width={48} height={48} className="mb-2 rounded-xl" />
        <h1 className="text-2xl font-semibold tracking-tight">LUMIQ Tournaments</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your company Microsoft account to continue.
        </p>
      </div>
      <SignIn
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
