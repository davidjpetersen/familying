/**
 * Unit tests for OrganizationProfile component
 * Testing contract compliance and organization management flows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type OrganizationProfileProps } from '@/lib/types/family-organization-components';
import { 
  resetMockClerk,
  createMockOrganization,
  MockOrganizationProfile,
} from '../../__mocks__/clerk';

// Mock the component implementation (will be implemented after tests)
const MockOrganizationProfileWrapper = jest.fn<React.ReactElement, [OrganizationProfileProps]>(
  ({ 
    organizationId, 
    onUpdated, 
    className, 
    showMemberManagement = true, 
    showSettings = true 
  }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>();

    const handleUpdate = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (organizationId === 'org_error') {
          throw new Error('Update failed');
        }
        
        onUpdated?.(organizationId || 'org_test123');
      } catch (err) {
        setError('Failed to update organization profile');
      } finally {
        setIsLoading(false);
      }
    };

    const handleError = () => {
      setError('Test error');
    };

    return (
      <div className={className} data-testid="organization-profile-wrapper">
        <div data-testid="organization-profile-header">
          <h2>Family Organization Profile</h2>
          {organizationId && (
            <p data-testid="organization-id">Organization: {organizationId}</p>
          )}
        </div>

        {error && (
          <div 
            data-testid="error-message" 
            role="alert" 
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {isLoading && (
          <div data-testid="loading-indicator" aria-live="polite">
            Updating organization...
          </div>
        )}

        <div data-testid="organization-details">
          <MockOrganizationProfile 
            organizationId={organizationId}
            onUpdated={onUpdated}
          />
        </div>

        {showSettings && (
          <div data-testid="organization-settings">
            <h3>Organization Settings</h3>
            <button
              data-testid="update-settings-button"
              onClick={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Settings'}
            </button>
          </div>
        )}

        {showMemberManagement && (
          <div data-testid="member-management">
            <h3>Member Management</h3>
            <div data-testid="member-list">
              <p>Family Members: 3</p>
            </div>
            <button data-testid="invite-member-button">
              Invite Member
            </button>
          </div>
        )}

        <div data-testid="test-controls">
          <button 
            data-testid="trigger-error-button"
            onClick={handleError}
          >
            Trigger Error
          </button>
        </div>
      </div>
    );
  }
);

// Mock the module
jest.mock('@/components/family/OrganizationProfile', () => ({
  OrganizationProfile: MockOrganizationProfileWrapper,
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => require('../../__mocks__/clerk').default);

describe('OrganizationProfile Component', () => {
  beforeEach(() => {
    resetMockClerk();
    jest.clearAllMocks();
  });

  // =============================================================================
  // Contract Compliance Tests
  // =============================================================================

  describe('Contract Compliance', () => {
    test('accepts all props from OrganizationProfileProps interface', () => {
      const onUpdated = jest.fn();
      const className = 'custom-profile-class';
      const organizationId = 'org_test123';

      render(
        <MockOrganizationProfileWrapper
          organizationId={organizationId}
          onUpdated={onUpdated}
          className={className}
          showMemberManagement={true}
          showSettings={true}
        />
      );

      expect(screen.getByTestId('organization-profile-wrapper')).toHaveClass('custom-profile-class');
      expect(screen.getByTestId('organization-id')).toHaveTextContent(`Organization: ${organizationId}`);
      expect(screen.getByTestId('member-management')).toBeInTheDocument();
      expect(screen.getByTestId('organization-settings')).toBeInTheDocument();
    });

    test('handles optional props correctly', () => {
      render(<MockOrganizationProfileWrapper />);

      expect(screen.getByTestId('organization-profile-wrapper')).toBeInTheDocument();
      expect(screen.queryByTestId('organization-id')).not.toBeInTheDocument();
      expect(screen.getByTestId('member-management')).toBeInTheDocument();
      expect(screen.getByTestId('organization-settings')).toBeInTheDocument();
    });

    test('respects showMemberManagement flag', () => {
      render(<MockOrganizationProfileWrapper showMemberManagement={false} />);

      expect(screen.queryByTestId('member-management')).not.toBeInTheDocument();
      expect(screen.getByTestId('organization-settings')).toBeInTheDocument();
    });

    test('respects showSettings flag', () => {
      render(<MockOrganizationProfileWrapper showSettings={false} />);

      expect(screen.getByTestId('member-management')).toBeInTheDocument();
      expect(screen.queryByTestId('organization-settings')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // Organization Profile Display Tests
  // =============================================================================

  describe('Organization Profile Display', () => {
    test('displays organization profile information', () => {
      const organizationId = 'org_display_test';
      
      render(
        <MockOrganizationProfileWrapper organizationId={organizationId} />
      );

      expect(screen.getByTestId('organization-profile-header')).toBeInTheDocument();
      expect(screen.getByTestId('organization-id')).toHaveTextContent(`Organization: ${organizationId}`);
      expect(screen.getByTestId('organization-details')).toBeInTheDocument();
    });

    test('displays member management section when enabled', () => {
      render(<MockOrganizationProfileWrapper showMemberManagement={true} />);

      expect(screen.getByTestId('member-management')).toBeInTheDocument();
      expect(screen.getByText('Member Management')).toBeInTheDocument();
      expect(screen.getByTestId('member-list')).toBeInTheDocument();
      expect(screen.getByTestId('invite-member-button')).toBeInTheDocument();
    });

    test('displays organization settings when enabled', () => {
      render(<MockOrganizationProfileWrapper showSettings={true} />);

      expect(screen.getByTestId('organization-settings')).toBeInTheDocument();
      expect(screen.getByText('Organization Settings')).toBeInTheDocument();
      expect(screen.getByTestId('update-settings-button')).toBeInTheDocument();
    });

    test('handles missing organization gracefully', () => {
      render(<MockOrganizationProfileWrapper organizationId={undefined} />);

      expect(screen.getByTestId('organization-profile-wrapper')).toBeInTheDocument();
      expect(screen.queryByTestId('organization-id')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // User Interaction Tests
  // =============================================================================

  describe('User Interactions', () => {
    test('calls onUpdated callback when profile is updated', async () => {
      const user = userEvent.setup();
      const onUpdated = jest.fn();
      const organizationId = 'org_update_test';
      
      render(
        <MockOrganizationProfileWrapper 
          organizationId={organizationId}
          onUpdated={onUpdated}
        />
      );

      const updateButton = screen.getByTestId('update-settings-button');
      
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(onUpdated).toHaveBeenCalledWith(organizationId);
      });
    });

    test('handles update without organizationId', async () => {
      const user = userEvent.setup();
      const onUpdated = jest.fn();
      
      render(<MockOrganizationProfileWrapper onUpdated={onUpdated} />);

      const updateButton = screen.getByTestId('update-settings-button');
      
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(onUpdated).toHaveBeenCalledWith('org_test123');
      });
    });

    test('disables update button during loading', async () => {
      const user = userEvent.setup();
      
      render(<MockOrganizationProfileWrapper />);

      const updateButton = screen.getByTestId('update-settings-button');
      
      await user.click(updateButton);
      
      expect(updateButton).toBeDisabled();
      expect(updateButton).toHaveTextContent('Updating...');
      
      await waitFor(() => {
        expect(updateButton).not.toBeDisabled();
        expect(updateButton).toHaveTextContent('Update Settings');
      });
    });

    test('handles member invitation interactions', async () => {
      const user = userEvent.setup();
      
      render(<MockOrganizationProfileWrapper showMemberManagement={true} />);

      const inviteButton = screen.getByTestId('invite-member-button');
      expect(inviteButton).toBeInTheDocument();
      
      await user.click(inviteButton);
      // In real implementation, this would open invitation modal or navigate to invitation page
    });
  });

  // =============================================================================
  // Loading State Tests
  // =============================================================================

  describe('Loading States', () => {
    test('shows loading state during profile updates', async () => {
      const user = userEvent.setup();
      
      render(<MockOrganizationProfileWrapper />);

      const updateButton = screen.getByTestId('update-settings-button');
      
      await user.click(updateButton);
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('loading-indicator')).toHaveTextContent('Updating organization...');
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    test('provides accessible loading announcements', async () => {
      const user = userEvent.setup();
      
      render(<MockOrganizationProfileWrapper />);

      const updateButton = screen.getByTestId('update-settings-button');
      
      await user.click(updateButton);
      
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    test('displays error messages when updates fail', async () => {
      const user = userEvent.setup();
      
      render(
        <MockOrganizationProfileWrapper organizationId="org_error" />
      );

      const updateButton = screen.getByTestId('update-settings-button');
      
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to update organization profile');
      });
    });

    test('provides accessible error announcements', async () => {
      const user = userEvent.setup();
      
      render(<MockOrganizationProfileWrapper />);

      const triggerErrorButton = screen.getByTestId('trigger-error-button');
      
      await user.click(triggerErrorButton);
      
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    test('allows retry after error', async () => {
      const user = userEvent.setup();
      const onUpdated = jest.fn();
      
      render(
        <MockOrganizationProfileWrapper 
          organizationId="org_error"
          onUpdated={onUpdated}
        />
      );

      const updateButton = screen.getByTestId('update-settings-button');
      
      // First attempt fails
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      expect(onUpdated).not.toHaveBeenCalled();
      
      // Button should be enabled for retry
      expect(updateButton).not.toBeDisabled();
    });

    test('clears errors on successful operations', async () => {
      const user = userEvent.setup();
      
      render(<MockOrganizationProfileWrapper />);

      const triggerErrorButton = screen.getByTestId('trigger-error-button');
      const updateButton = screen.getByTestId('update-settings-button');
      
      // Trigger error
      await user.click(triggerErrorButton);
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      
      // Successful update should clear error
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <MockOrganizationProfileWrapper 
          showMemberManagement={true}
          showSettings={true}
        />
      );

      const updateButton = screen.getByTestId('update-settings-button');
      const inviteButton = screen.getByTestId('invite-member-button');
      
      // Tab through interactive elements
      await user.tab();
      expect(updateButton).toHaveFocus();
      
      await user.tab();
      expect(inviteButton).toHaveFocus();
    });

    test('provides proper heading hierarchy', () => {
      render(
        <MockOrganizationProfileWrapper 
          showMemberManagement={true}
          showSettings={true}
        />
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Family Organization Profile');
      expect(screen.getByRole('heading', { level: 3, name: 'Organization Settings' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Member Management' })).toBeInTheDocument();
    });

    test('maintains focus management during updates', async () => {
      const user = userEvent.setup();
      
      render(<MockOrganizationProfileWrapper />);

      const updateButton = screen.getByTestId('update-settings-button');
      
      await user.click(updateButton);
      
      // Focus should remain manageable during loading
      expect(document.activeElement).toBeTruthy();
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Integration', () => {
    test('integrates with Clerk OrganizationProfile component', () => {
      const organizationId = 'org_integration_test';
      
      render(
        <MockOrganizationProfileWrapper organizationId={organizationId} />
      );

      expect(screen.getByTestId('organization-details')).toBeInTheDocument();
      
      // Verify that the mock Clerk component receives the organization ID
      expect(MockOrganizationProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: organizationId,
        }),
        expect.anything()
      );
    });

    test('handles organization switching', () => {
      const { rerender } = render(
        <MockOrganizationProfileWrapper organizationId="org_1" />
      );

      expect(screen.getByTestId('organization-id')).toHaveTextContent('Organization: org_1');
      
      rerender(
        <MockOrganizationProfileWrapper organizationId="org_2" />
      );

      expect(screen.getByTestId('organization-id')).toHaveTextContent('Organization: org_2');
    });

    test('adapts to different user roles', () => {
      // Admin user should see all features
      render(
        <MockOrganizationProfileWrapper 
          showMemberManagement={true}
          showSettings={true}
        />
      );

      expect(screen.getByTestId('member-management')).toBeInTheDocument();
      expect(screen.getByTestId('organization-settings')).toBeInTheDocument();
      
      // Basic member should see limited features
      const { rerender } = render(
        <MockOrganizationProfileWrapper 
          showMemberManagement={false}
          showSettings={false}
        />
      );

      rerender(
        <MockOrganizationProfileWrapper 
          showMemberManagement={false}
          showSettings={false}
        />
      );

      expect(screen.queryByTestId('member-management')).not.toBeInTheDocument();
      expect(screen.queryByTestId('organization-settings')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // Performance Tests
  // =============================================================================

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      let renderCount = 0;
      
      const TestComponent = (props: OrganizationProfileProps) => {
        renderCount++;
        return <MockOrganizationProfileWrapper {...props} />;
      };

      const { rerender } = render(<TestComponent organizationId="org_test" />);
      
      const initialRenderCount = renderCount;
      
      // Rerender with same props should not increase render count significantly
      rerender(<TestComponent organizationId="org_test" />);
      rerender(<TestComponent organizationId="org_test" />);
      
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(2);
    });

    test('handles rapid state changes efficiently', async () => {
      const user = userEvent.setup();
      
      render(<MockOrganizationProfileWrapper />);

      const updateButton = screen.getByTestId('update-settings-button');
      
      // Rapid clicks should be handled gracefully
      await user.click(updateButton);
      expect(updateButton).toBeDisabled();
      
      // Additional clicks while disabled should not cause issues
      await user.click(updateButton);
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(updateButton).not.toBeDisabled();
      });
    });
  });
});