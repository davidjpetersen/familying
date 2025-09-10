/**
 * Create Family Page
 * 
 * Page for users to create a new family organization.
 * Includes authentication check and redirect logic for existing members.
 */

import React from 'react';
import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CreateFamilyForm } from '@/app/components/family/CreateFamilyForm';
import { OrganizationMemberGuard } from '@/app/components/guards/OrganizationMemberGuard';
import { FAMILY_ROUTES } from '../lib/config/family-organization';

export const metadata: Metadata = {
  title: 'Create Your Family | Familying.org',
  description: 'Set up your family organization to start managing activities, meals, and memories together.',
  robots: {
    index: false, // Don't index family creation pages for privacy
  },
};

/**
 * Create Family Page Component
 */
export default async function CreateFamilyPage() {
  // Check authentication server-side
  const { userId } = await auth();
  
  // Redirect unauthenticated users to sign in
  if (!userId) {
    redirect(FAMILY_ROUTES.signIn);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Your Family
            </h1>
            <p className="mt-2 text-gray-600">
              Start your family organization journey with Familying.org
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-center">
                <li className="relative pr-8 sm:pr-20">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-blue-600"></div>
                  </div>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                    <span className="text-white text-sm font-medium">1</span>
                  </div>
                  <span className="absolute top-10 left-1/2 transform -translate-x-1/2 text-sm font-medium text-blue-600">
                    Create Family
                  </span>
                </li>
                <li className="relative pr-8 sm:pr-20">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200"></div>
                  </div>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                    <span className="text-gray-500 text-sm font-medium">2</span>
                  </div>
                  <span className="absolute top-10 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-500">
                    Set Preferences
                  </span>
                </li>
                <li className="relative">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                    <span className="text-gray-500 text-sm font-medium">3</span>
                  </div>
                  <span className="absolute top-10 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-500">
                    Get Started
                  </span>
                </li>
              </ol>
            </nav>
          </div>

          {/* Family Creation Form */}
          <div className="bg-white shadow-lg rounded-lg">
            <div className="p-6 sm:p-8">
              <CreateFamilyForm
                redirectAfterCreation={true}
                redirectPath={FAMILY_ROUTES.dashboard}
                className="w-full"
              />
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              What happens after you create your family?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <p className="font-medium">Invite Family Members</p>
                <p>Add family members and assign roles</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="font-medium">Customize Settings</p>
                <p>Set preferences for activities and schedules</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="font-medium">Start Organizing</p>
                <p>Begin planning activities and creating memories</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}