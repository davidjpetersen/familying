/**
 * Organization Profile State Types
 * 
 * Types for managing organization profile editing and display
 */

/**
 * State for organization profile management
 * Used by OrganizationProfile components and related hooks
 */
export interface OrganizationProfileState {
  /** Whether the profile is currently being edited */
  isEditing: boolean;
  /** Whether changes are being saved */
  isSaving: boolean;
  /** Whether the profile data is loading */
  isLoading: boolean;
  /** Any error that occurred during profile operations */
  error: string | null;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** The last save timestamp */
  lastSaved: Date | null;
}