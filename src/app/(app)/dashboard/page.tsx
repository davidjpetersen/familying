import { requireAuth, getSubscriptionStatus } from "@/lib/auth/guards"

export default async function DashboardPage() {
  const user = await requireAuth()
  const subscription = await getSubscriptionStatus(user.id)

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-2">Welcome back, {user.firstName ?? user.username ?? "friend"}!</p>
      {subscription.status === "active" ? (
        <p className="text-sm text-muted-foreground">Plan: {subscription.plan}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No active subscription</p>
      )}
    </div>
  )
}
