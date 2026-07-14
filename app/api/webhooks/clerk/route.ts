import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { isAllowedEmail } from "@/lib/rbac"

export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req)
  } catch (err) {
    console.error("Clerk webhook verification failed", err)
    return new NextResponse("Webhook verification failed", { status: 400 })
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, primary_email_address_id } = evt.data

    const primaryEmail =
      email_addresses.find((e) => e.id === primary_email_address_id)?.email_address ??
      email_addresses[0]?.email_address

    if (!isAllowedEmail(primaryEmail)) {
      // Defense in depth: the Clerk Dashboard should already restrict sign-in to
      // the company domain. If it somehow lets a non-company email through,
      // we simply never create a User row for it — getCurrentUser() will
      // treat them as unrecognized and the app will send them to /unauthorized.
      return NextResponse.json({ ok: true, skipped: "domain-not-allowed" })
    }

    const name =
      [first_name, last_name].filter(Boolean).join(" ") || primaryEmail!.split("@")[0]

    try {
      await db.user.upsert({
        where: { clerkId: id },
        // Email is immutable once set — never overwritten on update, only on first create.
        update: { name },
        create: { clerkId: id, email: primaryEmail!, name },
      })
    } catch (err) {
      console.error("Failed to upsert user from Clerk webhook", id, err)
    }
  }

  if (evt.type === "user.deleted") {
    const id = evt.data.id
    if (id) {
      await db.user.deleteMany({ where: { clerkId: id } }).catch((err) => {
        console.error("Failed to delete user from Clerk webhook", id, err)
      })
    }
  }

  return NextResponse.json({ ok: true })
}
