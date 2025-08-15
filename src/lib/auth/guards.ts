import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const user = await currentUser()
  if (!user) {
    redirect("/sign-in")
  }
  return user
}

export type SubscriptionStatus =
  | { status: "none" }
  | { status: "active"; plan: string }

export async function getSubscriptionStatus(
  _userId: string,
): Promise<SubscriptionStatus> {
  // TODO: Integrate with real billing provider
  void _userId
  return { status: "none" }
}
