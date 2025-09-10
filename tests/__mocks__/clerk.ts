/**
 * Mock implementations for Clerk hooks and components
 * Used in unit tests for family organization features
 */

import { type MockOrganizationData } from '@/lib/types/family-organization-components';

// =============================================================================
// Mock Data Factories
// =============================================================================

export const createMockOrganization = (overrides: Partial<MockOrganizationData> = {}): MockOrganizationData => ({
  id: 'org_test123',
  name: 'Test Family',
  slug: 'test-family',
  createdAt: '2024-01-01T00:00:00Z',
  imageUrl: 'https://example.com/family-avatar.jpg',
  metadata: {
    preferences: {
      mealPlanningDay: 'sunday',
      activityReminders: true,
    },
  },
  membersCount: 3,
  userRole: 'admin',
  ...overrides,
});

export const createMockOrganizationList = (count: number = 1): MockOrganizationData[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockOrganization({
      id: `org_test${index + 1}`,
      name: `Test Family ${index + 1}`,
      slug: `test-family-${index + 1}`,
    })
  );
};

// =============================================================================
// Mock Clerk Hooks
// =============================================================================

export const mockUseOrganizationList = jest.fn(() => ({
  organizationList: [],
  isLoaded: true,
  setActive: jest.fn(),
}));

export const mockUseOrganization = jest.fn(() => ({
  organization: null,
  isLoaded: true,
  membership: null,
}));

export const mockUseUser = jest.fn(() => ({
  user: {
    id: 'user_test123',
    firstName: 'John',
    lastName: 'Doe',
    emailAddresses: [{ emailAddress: 'john@example.com' }],
  },
  isLoaded: true,
}));

export const mockUseAuth = jest.fn(() => ({
  isSignedIn: true,
  isLoaded: true,
  signOut: jest.fn(),
}));

// =============================================================================
// Mock Clerk Components
// =============================================================================

export const MockCreateOrganization = jest.fn(({ onCreated, onCancel }) => (
  <div data-testid="mock-create-organization">
    <form>
      <input 
        data-testid="organization-name-input" 
        placeholder="Organization name"
      />
      <button
        type="button"
        data-testid="create-organization-submit"
        onClick={() => onCreated?.({ 
          id: 'org_new123',
          name: 'New Test Family',
          slug: 'new-test-family',
        })}
      >
        Create Organization
      </button>
      <button
        type="button"
        data-testid="create-organization-cancel"
        onClick={() => onCancel?.()}
      >
        Cancel
      </button>
    </form>
  </div>
));

export const MockOrganizationProfile = jest.fn(({ onUpdated, organizationId }) => (
  <div data-testid="mock-organization-profile">
    <h2>Organization Profile</h2>
    <p>Organization ID: {organizationId || 'current'}</p>
    <button
      data-testid="update-organization-profile"
      onClick={() => onUpdated?.(organizationId || 'org_test123')}
    >
      Update Profile
    </button>
  </div>
));

export const MockSignIn = jest.fn(() => (
  <div data-testid="mock-sign-in">
    <h2>Sign In</h2>
    <form>
      <input placeholder="Email" />
      <input placeholder="Password" type="password" />
      <button type="submit">Sign In</button>
    </form>
  </div>
));

// =============================================================================
// Mock API Functions
// =============================================================================

export const mockCreateOrganization = jest.fn(async (params: any) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (params.name === 'ERROR_TEST') {
    throw new Error('Organization creation failed');
  }
  
  return {
    id: 'org_created123',
    name: params.name,
    slug: params.name.toLowerCase().replace(/\s+/g, '-'),
    createdAt: new Date().toISOString(),
    imageUrl: params.imageUrl,
    membersCount: 1,
    publicMetadata: params.publicMetadata,
    privateMetadata: params.privateMetadata,
  };
});

export const mockUpdateOrganization = jest.fn(async (organizationId: string, params: any) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (organizationId === 'org_error') {
    throw new Error('Organization update failed');
  }
  
  return {
    id: organizationId,
    ...params,
    updatedAt: new Date().toISOString(),
  };
});

// =============================================================================
// Test Scenario Builders
// =============================================================================

export interface TestScenario {
  name: string;
  mockData: {
    organizationList?: MockOrganizationData[];
    currentOrganization?: MockOrganizationData | null;
    isLoaded?: boolean;
    isSignedIn?: boolean;
  };
  expectedBehavior: {
    hasOrganization?: boolean;
    shouldShowCreateFamily?: boolean;
    shouldShowFamilySettings?: boolean;
    shouldRedirectTo?: string;
  };
}

export const createTestScenario = (scenario: TestScenario) => scenario;

export const commonTestScenarios: TestScenario[] = [
  createTestScenario({
    name: 'User with no organizations',
    mockData: {
      organizationList: [],
      currentOrganization: null,
      isLoaded: true,
      isSignedIn: true,
    },
    expectedBehavior: {
      hasOrganization: false,
      shouldShowCreateFamily: true,
      shouldShowFamilySettings: false,
    },
  }),
  
  createTestScenario({
    name: 'User with single organization',
    mockData: {
      organizationList: [createMockOrganization()],
      currentOrganization: createMockOrganization(),
      isLoaded: true,
      isSignedIn: true,
    },
    expectedBehavior: {
      hasOrganization: true,
      shouldShowCreateFamily: false,
      shouldShowFamilySettings: true,
    },
  }),
  
  createTestScenario({
    name: 'User with multiple organizations',
    mockData: {
      organizationList: createMockOrganizationList(3),
      currentOrganization: createMockOrganization(),
      isLoaded: true,
      isSignedIn: true,
    },
    expectedBehavior: {
      hasOrganization: true,
      shouldShowCreateFamily: false,
      shouldShowFamilySettings: true,
    },
  }),
  
  createTestScenario({
    name: 'Loading state',
    mockData: {
      organizationList: [],
      currentOrganization: null,
      isLoaded: false,
      isSignedIn: true,
    },
    expectedBehavior: {
      hasOrganization: false,
      shouldShowCreateFamily: false,
      shouldShowFamilySettings: false,
    },
  }),
  
  createTestScenario({
    name: 'Unauthenticated user',
    mockData: {
      organizationList: [],
      currentOrganization: null,
      isLoaded: true,
      isSignedIn: false,
    },
    expectedBehavior: {
      hasOrganization: false,
      shouldShowCreateFamily: false,
      shouldShowFamilySettings: false,
      shouldRedirectTo: '/sign-in',
    },
  }),
];

// =============================================================================
// Mock Setup Helpers
// =============================================================================

export const setupMockClerk = (scenario: TestScenario) => {
  const { mockData } = scenario;
  
  mockUseOrganizationList.mockReturnValue({
    organizationList: mockData.organizationList || [],
    isLoaded: mockData.isLoaded ?? true,
    setActive: jest.fn(),
  });
  
  mockUseOrganization.mockReturnValue({
    organization: mockData.currentOrganization,
    isLoaded: mockData.isLoaded ?? true,
    membership: mockData.currentOrganization ? {
      id: 'membership_test123',
      role: mockData.currentOrganization.userRole,
    } : null,
  });
  
  mockUseAuth.mockReturnValue({
    isSignedIn: mockData.isSignedIn ?? true,
    isLoaded: mockData.isLoaded ?? true,
    signOut: jest.fn(),
  });
};

export const resetMockClerk = () => {
  jest.clearAllMocks();
  
  // Reset to default values
  mockUseOrganizationList.mockReturnValue({
    organizationList: [],
    isLoaded: true,
    setActive: jest.fn(),
  });
  
  mockUseOrganization.mockReturnValue({
    organization: null,
    isLoaded: true,
    membership: null,
  });
  
  mockUseAuth.mockReturnValue({
    isSignedIn: true,
    isLoaded: true,
    signOut: jest.fn(),
  });
};

// =============================================================================
// Jest Mock Configuration
// =============================================================================

const clerkMocks = {
  useOrganizationList: mockUseOrganizationList,
  useOrganization: mockUseOrganization,
  useUser: mockUseUser,
  useAuth: mockUseAuth,
  CreateOrganization: MockCreateOrganization,
  OrganizationProfile: MockOrganizationProfile,
  SignIn: MockSignIn,
  SignOutButton: jest.fn(({ children }) => (
    <button data-testid="sign-out-button">{children}</button>
  )),
  UserButton: jest.fn(() => (
    <div data-testid="user-button">User Menu</div>
  )),
};

export default clerkMocks;