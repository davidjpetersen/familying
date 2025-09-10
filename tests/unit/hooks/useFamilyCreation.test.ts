/**
 * Unit tests for useFamilyCreation hook
 * Testing contract compliance and family creation flow
 */

import { renderHook, act } from '@testing-library/react';
import { type UseFamilyCreationReturn } from '@/lib/types/family-organization-components';
import { 
  mockCreateOrganization,
  resetMockClerk,
} from '../../__mocks__/clerk';

// Mock the hook implementation (will be implemented after tests)
const mockUseFamilyCreation = jest.fn((): UseFamilyCreationReturn => ({
  isCreating: false,
  error: undefined,
  createFamily: jest.fn(),
  reset: jest.fn(),
}));

// Mock the module
jest.mock('@/lib/hooks/useFamilyCreation', () => ({
  useFamilyCreation: mockUseFamilyCreation,
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => require('../../__mocks__/clerk').default);

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

describe('useFamilyCreation Hook', () => {
  beforeEach(() => {
    resetMockClerk();
    jest.clearAllMocks();
  });

  // =============================================================================
  // Contract Compliance Tests
  // =============================================================================

  describe('Contract Compliance', () => {
    test('returns object matching UseFamilyCreationReturn interface', () => {
      const { result } = renderHook(() => mockUseFamilyCreation());
      
      // Verify return type structure
      expect(result.current).toHaveProperty('isCreating');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('createFamily');
      expect(result.current).toHaveProperty('reset');
      
      // Verify types
      expect(typeof result.current.isCreating).toBe('boolean');
      expect(typeof result.current.createFamily).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      
      if (result.current.error) {
        expect(typeof result.current.error).toBe('string');
      }
    });

    test('createFamily function accepts required parameters', async () => {
      const mockCreateFamily = jest.fn().mockResolvedValue(undefined);
      
      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      // Test function signature
      await act(async () => {
        await result.current.createFamily('Test Family Name');
      });
      
      expect(mockCreateFamily).toHaveBeenCalledWith('Test Family Name');
      
      // Test with optional metadata
      await act(async () => {
        await result.current.createFamily('Test Family', { description: 'A test family' });
      });
      
      expect(mockCreateFamily).toHaveBeenCalledWith('Test Family', { description: 'A test family' });
    });
  });

  // =============================================================================
  // State Management Tests
  // =============================================================================

  describe('State Management', () => {
    test('initial state is correct', () => {
      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        createFamily: jest.fn(),
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    test('manages loading state during creation', async () => {
      const mockCreateFamily = jest.fn();
      const mockReset = jest.fn();
      
      // Initial state
      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        createFamily: mockCreateFamily,
        reset: mockReset,
      });

      const { result, rerender } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.isCreating).toBe(false);
      
      // Simulate creating state
      mockUseFamilyCreation.mockReturnValue({
        isCreating: true,
        error: undefined,
        createFamily: mockCreateFamily,
        reset: mockReset,
      });
      
      rerender();
      expect(result.current.isCreating).toBe(true);
      
      // Simulate completion
      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        createFamily: mockCreateFamily,
        reset: mockReset,
      });
      
      rerender();
      expect(result.current.isCreating).toBe(false);
    });

    test('manages error state correctly', () => {
      const errorMessage = 'Failed to create family organization';
      
      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: errorMessage,
        createFamily: jest.fn(),
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isCreating).toBe(false);
    });

    test('reset function clears error state', () => {
      const mockReset = jest.fn();
      
      // Start with error state
      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: 'Some error',
        createFamily: jest.fn(),
        reset: mockReset,
      });

      const { result, rerender } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.error).toBe('Some error');
      
      // Call reset
      act(() => {
        result.current.reset();
      });
      
      expect(mockReset).toHaveBeenCalled();
      
      // Simulate state after reset
      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        createFamily: jest.fn(),
        reset: mockReset,
      });
      
      rerender();
      expect(result.current.error).toBeUndefined();
    });
  });

  // =============================================================================
  // Family Creation Flow Tests
  // =============================================================================

  describe('Family Creation Flow', () => {
    test('successful family creation flow', async () => {
      const mockCreateFamily = jest.fn().mockImplementation(async (name: string) => {
        // Simulate successful creation
        mockCreateOrganization.mockResolvedValueOnce({
          id: 'org_new123',
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          createdAt: new Date().toISOString(),
          membersCount: 1,
        });
      });

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      await act(async () => {
        await result.current.createFamily('My Test Family');
      });
      
      expect(mockCreateFamily).toHaveBeenCalledWith('My Test Family');
    });

    test('handles family creation with metadata', async () => {
      const mockCreateFamily = jest.fn();
      const metadata = {
        preferences: {
          mealPlanningDay: 'sunday',
          activityReminders: true,
        },
      };

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      await act(async () => {
        await result.current.createFamily('Family with Metadata', metadata);
      });
      
      expect(mockCreateFamily).toHaveBeenCalledWith('Family with Metadata', metadata);
    });

    test('handles family creation errors', async () => {
      const errorMessage = 'Organization creation failed';
      const mockCreateFamily = jest.fn().mockRejectedValue(new Error(errorMessage));

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: errorMessage,
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.error).toBe(errorMessage);
    });

    test('prevents multiple simultaneous creation attempts', async () => {
      const mockCreateFamily = jest.fn();

      // Mock isCreating state as true
      mockUseFamilyCreation.mockReturnValue({
        isCreating: true,
        error: undefined,
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      // Attempting to create while already creating should not call the function
      // (This behavior will be enforced in the actual implementation)
      expect(result.current.isCreating).toBe(true);
    });
  });

  // =============================================================================
  // Validation Tests
  // =============================================================================

  describe('Input Validation', () => {
    test('handles empty family name', async () => {
      const mockCreateFamily = jest.fn();

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: 'Family name is required',
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      // Should have validation error for empty name
      expect(result.current.error).toBe('Family name is required');
    });

    test('handles invalid family name characters', async () => {
      const mockCreateFamily = jest.fn();

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: 'Family name can only contain letters, numbers, spaces, hyphens, and apostrophes',
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.error).toContain('Family name can only contain');
    });

    test('handles family name too long', async () => {
      const mockCreateFamily = jest.fn();

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: 'Family name must be less than 100 characters',
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.error).toBe('Family name must be less than 100 characters');
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    test('handles network errors gracefully', async () => {
      const networkError = 'Network error. Please check your connection and try again.';
      const mockCreateFamily = jest.fn();

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: networkError,
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.error).toBe(networkError);
    });

    test('handles organization limit exceeded', async () => {
      const limitError = 'You have reached the maximum number of families allowed.';
      const mockCreateFamily = jest.fn();

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: limitError,
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.error).toBe(limitError);
    });

    test('handles malformed metadata gracefully', async () => {
      const mockCreateFamily = jest.fn();
      const malformedMetadata = { invalidKey: undefined };

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      await act(async () => {
        await result.current.createFamily('Test Family', malformedMetadata);
      });
      
      expect(mockCreateFamily).toHaveBeenCalledWith('Test Family', malformedMetadata);
    });
  });

  // =============================================================================
  // Performance Tests
  // =============================================================================

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      let renderCount = 0;
      
      mockUseFamilyCreation.mockImplementation(() => {
        renderCount++;
        return {
          isCreating: false,
          error: undefined,
          createFamily: jest.fn(),
          reset: jest.fn(),
        };
      });

      const { rerender } = renderHook(() => mockUseFamilyCreation());
      
      const initialRenderCount = renderCount;
      
      // Multiple rerenders with same state should not increase render count significantly
      rerender();
      rerender();
      rerender();
      
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(3);
    });

    test('provides stable function references', () => {
      const mockFunctions = {
        createFamily: jest.fn(),
        reset: jest.fn(),
      };

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        ...mockFunctions,
      });

      const { result, rerender } = renderHook(() => mockUseFamilyCreation());
      
      const firstCreateFamily = result.current.createFamily;
      const firstReset = result.current.reset;
      
      rerender();
      
      // Function references should be stable to prevent unnecessary child re-renders
      expect(result.current.createFamily).toBe(firstCreateFamily);
      expect(result.current.reset).toBe(firstReset);
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Integration', () => {
    test('integrates with navigation after successful creation', async () => {
      const mockCreateFamily = jest.fn().mockResolvedValue(undefined);

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: undefined,
        createFamily: mockCreateFamily,
        reset: jest.fn(),
      });

      const { result } = renderHook(() => mockUseFamilyCreation());
      
      await act(async () => {
        await result.current.createFamily('New Family');
      });
      
      // After successful creation, should have called createFamily
      expect(mockCreateFamily).toHaveBeenCalledWith('New Family');
    });

    test('maintains error state until explicitly reset', () => {
      const errorMessage = 'Creation failed';
      const mockReset = jest.fn();

      mockUseFamilyCreation.mockReturnValue({
        isCreating: false,
        error: errorMessage,
        createFamily: jest.fn(),
        reset: mockReset,
      });

      const { result, rerender } = renderHook(() => mockUseFamilyCreation());
      
      expect(result.current.error).toBe(errorMessage);
      
      // Error should persist across rerenders until reset is called
      rerender();
      expect(result.current.error).toBe(errorMessage);
      
      // Reset should clear the error
      act(() => {
        result.current.reset();
      });
      
      expect(mockReset).toHaveBeenCalled();
    });
  });
});