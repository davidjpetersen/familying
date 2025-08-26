import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
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
import { Navbar } from "@/components/Navbar";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar variant="dashboard" />

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
