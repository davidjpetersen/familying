/**
 * OrganizationProfile Component
 *
 * A wrapper component around Clerk's OrganizationProfile component
 * with custom styling, role-based access control, and family-specific features.
 */

"use client";

import React from "react";
import {
  OrganizationProfile as ClerkOrganizationProfile,
  useOrganization,
} from "@clerk/nextjs";
import { isOrganizationAdmin } from "../../lib/utils/family-organization";
import { cn } from "@/lib/utils";

interface OrganizationProfileProps {
  organizationId?: string;
  className?: string;
  showMemberManagement?: boolean;
}

/**
 * OrganizationProfile component that wraps Clerk's OrganizationProfile
 * with custom behavior and family-specific features
 */
export function OrganizationProfile({
  organizationId,
  className,
  showMemberManagement = true,
}: OrganizationProfileProps) {
  const { organization, membership, isLoaded } = useOrganization();

  // Determine which organization to display
  // const targetOrganizationId = organizationId || organization?.id;

  // Check user permissions
  const userRole = membership?.role;
  const isAdmin = isOrganizationAdmin(userRole);

  /**
   * Handle organization profile updates
   */
  // const handleUpdated = useCallback(
  //   (org: Organization) => {
  //     console.log("Organization profile updated:", org);
  //
  //     // Clear any previous errors
  //     setError(undefined);
  //
  //     // Call the provided callback
  //     onUpdated?.(org.id);
  //   },
  //   [onUpdated]
  // );

  /**
   * Handle organization update errors
   */
  // const handleError = useCallback((error: Error) => {
  //   console.error("Organization profile error:", error);
  //   setError("Failed to update organization profile. Please try again.");
  // }, []);

  // Loading state
  if (!isLoaded) {
    return (
      <div className={cn("organization-profile-loading", className)}>
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
      <div className={cn("organization-profile-empty", className)}>
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No Organization
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to belong to a family organization to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("organization-profile", className)}>
      {/* Clerk OrganizationProfile Component */}
      <ClerkOrganizationProfile
        appearance={{
          elements: {
            card: "shadow-lg",
            navbar: "border-b border-gray-200",
          },
        }}
      />

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
                Contact a family administrator to invite new members or change
                member roles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationProfile;
