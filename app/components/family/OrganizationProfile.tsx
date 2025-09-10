/**
 * OrganizationProfile Component
 * 
 * A wrapper component around Clerk's OrganizationProfile component
 * with custom styling, role-based access control, and family-specific features.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { OrganizationProfile as ClerkOrganizationProfile, useOrganization, useUser } from '@clerk/nextjs';
import { isOrganizationAdmin } from '../../lib/utils/family-organization';
import { cn } from '@/lib/utils';

interface OrganizationProfileProps {
  organizationId?: string;
  onUpdated?: (organizationId: string) => void;
  className?: string;
  showMemberManagement?: boolean;
  showSettings?: boolean;
}

/**
 * OrganizationProfile component that wraps Clerk's OrganizationProfile
 * with custom behavior and family-specific features
 */
export function OrganizationProfile({
  organizationId,
  onUpdated,
  className,
  showMemberManagement = true,
  showSettings = true,
}: OrganizationProfileProps) {
  const { organization, membership, isLoaded } = useOrganization();
  const { user } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Determine which organization to display
  const targetOrganizationId = organizationId || organization?.id;
  
  // Check user permissions
  const userRole = membership?.role;
  const isAdmin = isOrganizationAdmin(userRole);

  /**
   * Handle organization profile updates
   */
  const handleUpdated = useCallback((org: any) => {
    console.log('Organization profile updated:', org);
    
    // Clear any previous errors
    setError(undefined);
    
    // Call the provided callback
    onUpdated?.(org.id);
  }, [onUpdated]);

  /**
   * Handle organization update errors
   */
  const handleError = useCallback((error: any) => {
    console.error('Organization profile error:', error);
    setError('Failed to update organization profile. Please try again.');
  }, []);

  // Loading state
  if (!isLoaded) {
    return (
      <div className={cn('organization-profile-loading', className)}>
        <div className="animate-pulse">
          <div className="bg-gray-200 h-8 w-64 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="bg-gray-200 h-4 w-full rounded"></div>
            <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
            <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // No organization state
  if (!organization && !organizationId) {
    return (
      <div className={cn('organization-profile-empty', className)}>
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Organization</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to belong to a family organization to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('organization-profile', className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Family Settings
        </h2>
        <p className="text-gray-600">
          Manage your family organization profile, members, and preferences.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div 
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-red-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isUpdating && (
        <div 
          className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md"
          aria-live="polite"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg 
                className="animate-spin h-5 w-5 text-blue-600" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                Updating organization profile...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Organization Info Summary */}
      {organization && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center">
            {organization.imageUrl && (
              <img 
                src={organization.imageUrl} 
                alt={`${organization.name} avatar`}
                className="h-10 w-10 rounded-full object-cover mr-3"
              />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {organization.name}
              </h3>
              <p className="text-sm text-gray-500">
                {organization.membersCount} member{organization.membersCount !== 1 ? 's' : ''}
                {userRole && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {userRole === 'admin' ? 'Administrator' : 'Member'}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clerk OrganizationProfile Component */}
      <div className="clerk-organization-profile">
        <ClerkOrganizationProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-lg border border-gray-200 rounded-lg bg-white",
              headerTitle: "text-xl font-semibold text-gray-900",
              headerSubtitle: "text-gray-600",
              formButtonPrimary: 
                "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              formFieldInput: 
                "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              formFieldLabel: 
                "block text-sm font-medium text-gray-700 mb-1",
              formFieldErrorText: 
                "mt-1 text-sm text-red-600",
              section: "mb-6 p-6 border border-gray-200 rounded-lg",
              sectionTitle: "text-lg font-medium text-gray-900 mb-4",
              table: "min-w-full divide-y divide-gray-200",
              tableHead: "bg-gray-50",
              tableCell: "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
              badge: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              button: "inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            },
            variables: {
              colorPrimary: "#2563eb",
              colorText: "#374151",
              colorTextSecondary: "#6b7280",
              colorBackground: "#ffffff",
              colorInputBackground: "#ffffff",
              colorInputText: "#374151",
              borderRadius: "0.375rem",
            },
          }}
          // Conditional features based on props and permissions
          organizationProfileMode={{
            general: showSettings,
            members: showMemberManagement && isAdmin,
          }}
        />
      </div>

      {/* Non-admin message for member management */}
      {showMemberManagement && !isAdmin && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-yellow-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                You need administrator privileges to manage family members. 
                Contact a family administrator to invite new members or change member roles.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Helper Text */}
      <div className="sr-only" aria-live="polite" id="profile-status">
        {isUpdating && "Organization profile update in progress"}
        {error && `Error: ${error}`}
      </div>
    </div>
  );
}

export default OrganizationProfile;