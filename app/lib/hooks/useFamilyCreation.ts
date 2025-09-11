/**
 * useFamilyCreation Hook
 * 
 * Manages family creation flow state, validation, and API interactions
 * with Clerk's organization system.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface UseFamilyCreationReturn {
  isCreating: boolean;
  error?: string;
  createFamily: (name: string) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing family creation flow
 * 
 * @returns {UseFamilyCreationReturn} Family creation state and functions
 */
export function useFamilyCreation(): UseFamilyCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  /**
   * Create a new family organization
   */
  const createFamily = useCallback(async (name: string) => {
    // Prevent multiple simultaneous creation attempts
    if (isCreating) {
      return;
    }

    // Reset previous errors
    setError(undefined);

    // Basic validation
    if (!name || name.trim().length < 2) {
      setError('Family name must be at least 2 characters');
      return;
    }

    try {
      setIsCreating(true);

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to dashboard after successful creation
      router.push('/dashboard');

    } catch (err: unknown) {
      console.error('Family creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create family organization');
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, router]);

  /**
   * Reset the hook state (clear errors, reset loading)
   */
  const reset = useCallback(() => {
    setError(undefined);
    setIsCreating(false);
  }, []);

  return {
    isCreating,
    error,
    createFamily,
    reset,
  };
}


export default useFamilyCreation;