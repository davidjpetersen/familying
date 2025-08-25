import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Calendar, 
  CheckCircle, 
  Camera, 
  MessageCircle, 
  DollarSign, 
  Settings,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-primary">Familying</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Dashboard</Badge>
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome to Your Family Dashboard!
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Your family's central hub for managing calendars, tasks, photos, and staying connected.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
