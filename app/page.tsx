import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Smartphone, Users, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default async function Home() {
  const { userId } = await auth();
  
  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Navigation */}
      <Navbar variant="home" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <Badge variant="secondary" className="mb-6">
            <Star className="w-4 h-4 mr-1" />
            Trusted by families worldwide
          </Badge>
          <h1 className="text-4xl tracking-tight font-extrabold text-foreground sm:text-5xl md:text-6xl">
            <span className="block">Bring Your Family</span>
            <span className="block text-primary">Together</span>
          </h1>
          <p className="mt-6 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-8 md:text-xl md:max-w-3xl">
            The ultimate platform for family planning, coordination, and connection. 
            Keep everyone in sync with shared calendars, tasks, and memories.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                <Users className="mr-2 h-4 w-4" />
                Start Free Trial
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Everything your family needs
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              Powerful tools designed to bring families closer together and make life easier.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="text-center">
                <CardHeader>
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground mx-auto">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <CardTitle>Shared Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Keep everyone synchronized with shared family events and schedules.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground mx-auto">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <CardTitle>Task Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Assign and track household tasks and responsibilities.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground mx-auto">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <CardTitle>Mobile Ready</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Access your family hub from anywhere on any device.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
