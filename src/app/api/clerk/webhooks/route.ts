import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { Webhook } from "svix"
import { deleteUser, upsertUser } from "@/lib/users/sync"

const secret = process.env.CLERK_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const payload = await req.text()
  const headerList = headers()

  const svixId = headerList.get("svix-id")
  const svixTimestamp = headerList.get("svix-timestamp")
  const svixSignature = headerList.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  let evt: WebhookEvent

  try {
    const wh = new Webhook(secret)
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Webhook verification failed", err)
    return new Response("Invalid signature", { status: 400 })
  }

  const { type, data } = evt

  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses?.[0]?.email_address ?? null
    await upsertUser({ clerkUserId: data.id, email })
  } else if (type === "user.deleted") {
    await deleteUser(data.id)
  }

  return new Response(null, { status: 200 })
}
