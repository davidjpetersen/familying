import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const client = createClient(supabaseUrl, serviceRoleKey)

export type SyncUser = {
  clerkUserId: string
  email: string | null
}

export async function upsertUser(user: SyncUser) {
  await client.from("users").upsert({
    clerk_user_id: user.clerkUserId,
    email: user.email,
  })
}

export async function deleteUser(clerkUserId: string) {
  await client.from("users").delete().eq("clerk_user_id", clerkUserId)
}
