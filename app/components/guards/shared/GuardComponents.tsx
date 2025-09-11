/**
 * Shared Guard Components
 * 
 * Common components used across different guard types to ensure
 * consistent UX and reduce code duplication.
 */

'use client';

import React from 'react';

interface GuardLoadingSpinnerProps {
  message?: string;
}

/**
 * Reusable loading spinner for guards
 */
export function GuardLoadingSpinner({ message = "Loading..." }: GuardLoadingSpinnerProps) {
  return (
    <div className="min-h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="max-w-md w-full space-y-4 p-6">
        <div className="flex justify-center">
          <svg 
            className="animate-spin h-6 w-6 text-blue-600" 
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
        <div className="text-center">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="bg-gray-200 h-3 w-3/4 rounded mx-auto"></div>
          <div className="bg-gray-200 h-3 w-1/2 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

interface GuardErrorMessageProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  variant?: 'error' | 'warning' | 'info';
}

/**
 * Reusable error/warning message for guards
 */
export function GuardErrorMessage({ 
  title, 
  message, 
  icon,
  variant = 'error' 
}: GuardErrorMessageProps) {
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900'
  };

  const iconColor = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };

  const textColor = {
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700'
  };

  const defaultIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
    </svg>
  );

  return (
    <div className={`min-h-64 flex items-center justify-center rounded-lg border ${variantStyles[variant]}`}>
      <div className="max-w-md text-center p-6">
        <div className={`mx-auto h-12 w-12 mb-4 ${iconColor[variant]}`}>
          {icon || defaultIcon}
        </div>
        <h3 className={`text-lg font-medium mb-2 ${variantStyles[variant]}`}>
          {title}
        </h3>
        <p className={textColor[variant]}>
          {message}
        </p>
      </div>
    </div>
  );
}