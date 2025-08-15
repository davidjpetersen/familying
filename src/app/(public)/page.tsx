import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { name: "Auth", tier: "Free" },
  { name: "Storage", tier: "Free" },
  { name: "Payments", tier: "Pro" },
  { name: "Analytics", tier: "Pro" },
  { name: "Messaging", tier: "Pro" },
  { name: "Notifications", tier: "Free" },
];

export default function Page() {
  return (
    <div className="space-y-24">
      <section className="py-20 text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Build family microservices faster</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Filler subheading that explains the value proposition of the product.
        </p>
        <Button asChild size="lg">
          <Link href="/sign-up">Start free</Link>
        </Button>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.name}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{feature.name}</CardTitle>
                <Badge variant={feature.tier === "Free" ? "secondary" : "default"}>{feature.tier}</Badge>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">$0</p>
              <p className="text-muted-foreground mt-2">Basic features to get started.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">$9</p>
              <p className="text-muted-foreground mt-2">Advanced tools for professionals.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-8">FAQ</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium">What is Familying?</h3>
            <p className="text-sm text-muted-foreground">Filler answer about the product.</p>
          </div>
          <div>
            <h3 className="font-medium">How do I upgrade?</h3>
            <p className="text-sm text-muted-foreground">Filler answer about upgrading.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
