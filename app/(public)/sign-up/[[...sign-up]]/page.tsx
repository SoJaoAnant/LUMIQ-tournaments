import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignUp
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
