import { SignOutButton } from "@clerk/nextjs"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md text-center">
        <CardHeader className="items-center gap-2">
          <ShieldAlert className="size-10 text-accent" />
          <CardTitle>Account not recognized</CardTitle>
          <CardDescription>
            We couldn&apos;t find or verify your account. Please sign out and try again, or
            contact an admin if this keeps happening.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton redirectUrl="/sign-in">
            <Button variant="outline">Sign out</Button>
          </SignOutButton>
        </CardContent>
      </Card>
    </div>
  )
}
