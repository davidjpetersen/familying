import { requireAuth, getSubscriptionStatus } from "@/lib/auth/guards"

export default async function SettingsPage() {
  const user = await requireAuth()
  const subscription = await getSubscriptionStatus(user.id)

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
      <p className="mb-2">Signed in as {user.emailAddresses[0]?.emailAddress}</p>
      {subscription.status === "active" ? (
        <p className="text-sm text-muted-foreground">Current plan: {subscription.plan}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No active subscription</p>
      )}
    </div>
  )
}
