/**
 * DashboardContent Component
 * 
 * Displays different content based on user's organization membership status.
 * Shows family creation interface for non-members or family dashboard for members.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Calendar, Camera, Plus, Settings } from 'lucide-react';
import { useOrganizationNavigation } from '../../lib/hooks/useOrganizationNavigation';
import { Button } from '@/components/ui/button';
import { FAMILY_ROUTES } from '../../lib/config/family-organization';

/**
 * Main dashboard content that adapts based on organization membership
 */
export function DashboardContent() {
  const { hasOrganization, shouldShowCreateFamily, currentOrganization, isLoaded } = useOrganizationNavigation();

  // Loading state
  if (!isLoaded) {
    return <DashboardLoading />;
  }

  // Show family creation interface for users without organizations
  if (shouldShowCreateFamily) {
    return <CreateFamilyDashboard />;
  }

  // Show family dashboard for organization members
  if (hasOrganization && currentOrganization) {
    return <FamilyDashboard organization={currentOrganization} />;
  }

  // Fallback loading state
  return <DashboardLoading />;
}

/**
 * Loading state component
 */
function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-8 w-64 rounded mb-4"></div>
          <div className="bg-gray-200 h-4 w-96 rounded mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard for users without family organizations
 */
function CreateFamilyDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Familying.org!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start your family organization journey by creating your family profile. 
              This will be your central hub for managing activities, schedules, and memories together.
            </p>
          </div>

          {/* Create Family CTA */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Create Your Family Organization
                </h2>
                <p className="text-gray-600">
                  Set up your family profile to get started with collaborative planning and organization.
                </p>
              </div>
              <Link href={FAMILY_ROUTES.createFamily}>
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Family
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              What you can do with your family organization:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Calendar className="h-6 w-6" />}
                title="Plan Activities"
                description="Coordinate family schedules, plan outings, and track important events together."
              />
              <FeatureCard
                icon={<Camera className="h-6 w-6" />}
                title="Share Memories"
                description="Create and share photo albums, milestone moments, and family stories."
              />
              <FeatureCard
                icon={<Settings className="h-6 w-6" />}
                title="Manage Together"
                description="Set family preferences, assign roles, and organize household responsibilities."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard for users with family organizations
 */
function FamilyDashboard({ organization }: { organization: { id: string; name: string; imageUrl?: string } }) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back to {organization.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Here&apos;s what&apos;s happening with your family
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={FAMILY_ROUTES.organizationSettings}>
                <Button variant="outline" size="sm">
                  Family Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature preview card component
 */
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg text-purple-600">
          {icon}
        </div>
        <h4 className="ml-3 text-lg font-medium text-gray-900">{title}</h4>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}


export default DashboardContent;