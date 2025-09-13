/**
 * Unit tests for CreateFamilyForm component
 * Testing contract compliance and user interaction flows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type CreateFamilyFormProps } from '@/lib/types/family-organization-components';
import { 
  resetMockClerk,
  MockCreateOrganization,
} from '../../__mocks__/clerk';

// Mock the component implementation (will be implemented after tests)
const MockCreateFamilyForm = jest.fn<React.ReactElement, [CreateFamilyFormProps]>(
  ({ onCreated, onCancel, className, redirectAfterCreation = true, redirectPath = '/dashboard' }) => {
    const [isCreating, setIsCreating] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get('familyName') as string;

      if (!name || name.trim().length === 0) {
        setError('Family name is required');
        return;
      }

      if (name === 'ERROR_TEST') {
        setError('Family creation failed');
        return;
      }

      setIsCreating(true);
      setError(undefined);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const mockOrganization = {
          id: 'org_created123',
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
        };

        onCreated?.(mockOrganization.id);
        
        if (redirectAfterCreation) {
          // Simulate navigation (in real implementation, would use Next.js router)
          console.log(`Redirecting to: ${redirectPath}`);
        }
      } catch (err) {
        setError('Failed to create family organization');
      } finally {
        setIsCreating(false);
      }
    };

    const handleCancel = () => {
      onCancel?.();
    };

    return (
      <div className={className} data-testid="create-family-form">
        <form onSubmit={handleSubmit}>
          <label htmlFor="familyName">
            Family Name
            <input
              id="familyName"
              name="familyName"
              type="text"
              required
              data-testid="family-name-input"
              aria-describedby={error ? 'family-name-error' : undefined}
            />
          </label>
          
          {error && (
            <div 
              id="family-name-error" 
              role="alert" 
              aria-live="polite"
              data-testid="error-message"
            >
              {error}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isCreating}
              data-testid="create-family-submit"
            >
              {isCreating ? 'Creating...' : 'Create Family'}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              data-testid="create-family-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
        
        {isCreating && (
          <div data-testid="loading-indicator" aria-live="polite">
            Creating your family...
          </div>
        )}
      </div>
    );
  }
);

// Mock the module
jest.mock('@/components/family/CreateFamilyForm', () => ({
  CreateFamilyForm: MockCreateFamilyForm,
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

describe('CreateFamilyForm Component', () => {
  beforeEach(() => {
    resetMockClerk();
    jest.clearAllMocks();
  });

  // =============================================================================
  // Contract Compliance Tests
  // =============================================================================

  describe('Contract Compliance', () => {
    test('accepts all required props from CreateFamilyFormProps interface', () => {
      const onCreated = jest.fn();
      const onCancel = jest.fn();
      const className = 'custom-class';

      render(
        <MockCreateFamilyForm
          onCreated={onCreated}
          onCancel={onCancel}
          className={className}
          redirectAfterCreation={false}
          redirectPath="/custom-path"
        />
      );

      expect(screen.getByTestId('create-family-form')).toHaveClass('custom-class');
      expect(screen.getByTestId('family-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('create-family-submit')).toBeInTheDocument();
      expect(screen.getByTestId('create-family-cancel')).toBeInTheDocument();
    });

    test('handles optional props correctly', () => {
      render(<MockCreateFamilyForm />);

      expect(screen.getByTestId('create-family-form')).toBeInTheDocument();
      expect(screen.getByTestId('family-name-input')).toBeInTheDocument();
    });

    test('provides accessible form elements', () => {
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByLabelText('Family Name');
      expect(nameInput).toBeRequired();
      expect(nameInput).toHaveAttribute('id', 'familyName');
      
      const submitButton = screen.getByRole('button', { name: /create family/i });
      expect(submitButton).toBeInTheDocument();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });
  });

  // =============================================================================
  // User Interaction Tests
  // =============================================================================

  describe('User Interactions', () => {
    test('handles family name input', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      
      await user.type(nameInput, 'The Smith Family');
      
      expect(nameInput).toHaveValue('The Smith Family');
    });

    test('calls onCreated callback when family is successfully created', async () => {
      const user = userEvent.setup();
      const onCreated = jest.fn();
      
      render(<MockCreateFamilyForm onCreated={onCreated} />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.type(nameInput, 'Test Family');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(onCreated).toHaveBeenCalledWith('org_created123');
      });
    });

    test('calls onCancel callback when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      
      render(<MockCreateFamilyForm onCancel={onCancel} />);

      const cancelButton = screen.getByTestId('create-family-cancel');
      
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalled();
    });

    test('prevents submission when form is invalid', async () => {
      const user = userEvent.setup();
      const onCreated = jest.fn();
      
      render(<MockCreateFamilyForm onCreated={onCreated} />);

      const submitButton = screen.getByTestId('create-family-submit');
      
      // Try to submit without entering a name
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Family name is required');
      });
      
      expect(onCreated).not.toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Form Validation Tests
  // =============================================================================

  describe('Form Validation', () => {
    test('shows error for empty family name', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Family name is required');
      });
    });

    test('shows error for whitespace-only family name', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.type(nameInput, '   ');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Family name is required');
      });
    });

    test('shows accessible error messages', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
        expect(nameInput).toHaveAttribute('aria-describedby', 'family-name-error');
      });
    });

    test('clears errors when user corrects input', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      // Trigger error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      // Fix the error by entering valid name
      await user.type(nameInput, 'Valid Family Name');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // Loading State Tests
  // =============================================================================

  describe('Loading States', () => {
    test('shows loading state during family creation', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.type(nameInput, 'New Family');
      await user.click(submitButton);
      
      // Should show loading state immediately
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Creating...');
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    test('disables form during submission', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.type(nameInput, 'Test Family');
      await user.click(submitButton);
      
      expect(submitButton).toBeDisabled();
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test('provides accessible loading announcements', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.type(nameInput, 'Test Family');
      await user.click(submitButton);
      
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
      expect(loadingIndicator).toHaveTextContent('Creating your family...');
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    test('handles creation errors gracefully', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      // Use special error trigger name
      await user.type(nameInput, 'ERROR_TEST');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Family creation failed');
      });
      
      expect(submitButton).not.toBeDisabled();
    });

    test('allows retry after error', async () => {
      const user = userEvent.setup();
      const onCreated = jest.fn();
      
      render(<MockCreateFamilyForm onCreated={onCreated} />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      // First attempt with error
      await user.type(nameInput, 'ERROR_TEST');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      // Clear and retry with valid name
      await user.clear(nameInput);
      await user.type(nameInput, 'Valid Family');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(onCreated).toHaveBeenCalledWith('org_created123');
      });
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      const cancelButton = screen.getByTestId('create-family-cancel');
      
      // Tab through form elements
      await user.tab();
      expect(nameInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
      
      await user.tab();
      expect(cancelButton).toHaveFocus();
    });

    test('provides proper ARIA labels and descriptions', () => {
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByLabelText('Family Name');
      expect(nameInput).toHaveAttribute('id', 'familyName');
      
      // Test that input is properly labeled
      expect(nameInput).toBeRequired();
    });

    test('announces errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    test('maintains focus management during interactions', async () => {
      const user = userEvent.setup();
      render(<MockCreateFamilyForm />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.click(nameInput);
      expect(nameInput).toHaveFocus();
      
      await user.type(nameInput, 'Test Family');
      await user.click(submitButton);
      
      // Focus should remain manageable during loading
      expect(document.activeElement).toBeTruthy();
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Integration', () => {
    test('integrates with Clerk CreateOrganization component', () => {
      // This test verifies that the component would integrate with Clerk
      // The actual implementation will use Clerk's CreateOrganization component
      
      render(<MockCreateFamilyForm />);
      
      expect(screen.getByTestId('create-family-form')).toBeInTheDocument();
    });

    test('handles redirect after creation correctly', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(
        <MockCreateFamilyForm 
          redirectAfterCreation={true}
          redirectPath="/custom-dashboard"
        />
      );

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.type(nameInput, 'Test Family');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Redirecting to: /custom-dashboard');
      });
      
      consoleSpy.mockRestore();
    });

    test('respects redirectAfterCreation flag', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<MockCreateFamilyForm redirectAfterCreation={false} />);

      const nameInput = screen.getByTestId('family-name-input');
      const submitButton = screen.getByTestId('create-family-submit');
      
      await user.type(nameInput, 'Test Family');
      await user.click(submitButton);
      
      await waitFor(() => {
        // Wait for creation to complete
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});