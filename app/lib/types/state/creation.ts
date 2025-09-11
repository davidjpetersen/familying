/**
 * Family Creation State Types
 * 
 * Types for managing the family creation flow
 */

/**
 * State management for family creation process
 * Used by the useFamilyCreation hook and CreateFamilyForm component
 */
export interface FamilyCreationState {
  /** Current step in the creation process */
  currentStep: 'form' | 'creating' | 'success' | 'error';
  /** Form data being collected */
  formData: {
    name: string;
    description?: string;
    imageUrl?: string;
  };
  /** Whether the creation process is currently running */
  isCreating: boolean;
  /** Any error that occurred during creation */
  error: string | null;
  /** The created organization ID (available after successful creation) */
  createdOrganizationId: string | null;
  /** Progress indicator (0-100) */
  progress: number;
}