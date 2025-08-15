import Link from "next/link"
import { redirect } from "next/navigation"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

import { getFeatures } from "./actions"
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const { userId } = auth()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let subscribed = false
  if (userId) {
    const { data } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .single()
    subscribed = data?.status === "active"
  }

  const features = await getFeatures()

  return (
    <>
      <SignedOut>{redirect("/sign-in")}</SignedOut>
      <SignedIn>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.id}>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>{feature.label}</CardTitle>
                  <Badge variant="outline">
                    {feature.tier === "pro" ? "Pro" : "Free"}
                  </Badge>
                </div>
                <Badge variant={feature.enabled ? "default" : "destructive"}>
                  {feature.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </CardHeader>
              <CardFooter className="gap-2">
                <Button
                  asChild
                  disabled={!feature.enabled || (feature.tier === "pro" && !subscribed)}
                >
                  <Link href={feature.route}>Open</Link>
                </Button>
                {feature.tier === "pro" && !subscribed && (
                  <Button variant="secondary" asChild>
                    <Link href="/pricing">Unlock Pro</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </SignedIn>
    </>
  )
}
