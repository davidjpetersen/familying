/**
 * CreateFamilyForm Component
 * 
 * A form component for creating new family organizations using Clerk's
 * CreateOrganization component with custom styling and behavior.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { CreateOrganization } from '@clerk/nextjs';
import { useFamilyCreation } from '../../lib/hooks/useFamilyCreation';
import { FAMILY_ROUTES } from '../../lib/config/family-organization';
import { cn } from '@/lib/utils';

interface CreateFamilyFormProps {
  onCancel?: () => void;
  className?: string;
  redirectAfterCreation?: boolean;
  redirectPath?: string;
}

/**
 * CreateFamilyForm component that integrates Clerk's CreateOrganization
 * with custom family creation logic and styling
 */
export function CreateFamilyForm({
  onCancel,
  className,
  redirectAfterCreation = true,
  redirectPath = FAMILY_ROUTES.dashboard,
}: CreateFamilyFormProps) {
  const { isCreating, error, reset } = useFamilyCreation();
  const [showClerkForm] = useState(true);

  /**
   * Handle successful family creation
   */
  // const handleCreated = useCallback((organization: { id: string }) => {
  //   console.log('Family organization created:', organization);
  //   
  //   // Call the provided callback
  //   onCreated?.(organization.id);
  //   
  //   // Reset any error state
  //   reset();
  //   
  //   // Navigate to dashboard if redirect is enabled
  //   if (redirectAfterCreation) {
  //     router.push(redirectPath);
  //   }
  // }, [onCreated, reset, redirectAfterCreation, redirectPath, router]);

  /**
   * Handle form cancellation
   */
  const handleCancel = useCallback(() => {
    console.log('Family creation cancelled');
    
    // Reset any error state
    reset();
    
    // Call the provided callback
    onCancel?.();
  }, [onCancel, reset]);


  return (
    <div className={cn('family-creation-form', className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Create Your Family
        </h2>
        <p className="text-gray-600">
          Set up your family organization to start managing activities, meals, and memories together.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div 
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"
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
      {isCreating && (
        <div 
          className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md"
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
                Creating your family organization...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clerk CreateOrganization Component */}
      {showClerkForm && (
        <div className="clerk-form-container">
          <CreateOrganization
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-lg border border-gray-200 rounded-lg bg-white",
                headerTitle: "sr-only", // Hide default title since we have our own
                headerSubtitle: "sr-only", // Hide default subtitle
                formButtonPrimary: 
                  "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                formFieldInput: 
                  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                formFieldLabel: 
                  "block text-sm font-medium text-gray-700 mb-1",
                formFieldErrorText: 
                  "mt-1 text-sm text-red-600",
                footer: "mt-6 pt-4 border-t border-gray-200",
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
            skipInvitationScreen={true}
            hideSlug={false}
            afterCreateOrganizationUrl={redirectAfterCreation ? redirectPath : undefined}
          />
        </div>
      )}

      {/* Custom Cancel Button */}
      {onCancel && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            disabled={isCreating}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Accessibility Helper Text */}
      <div className="sr-only" aria-live="polite" id="form-status">
        {isCreating && "Family creation in progress"}
        {error && `Error: ${error}`}
      </div>
    </div>
  );
}

export default CreateFamilyForm;