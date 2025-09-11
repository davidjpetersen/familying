/**
 * Common Shared Types
 * 
 * Basic types used across multiple domains
 */

/**
 * Days of the week
 */
export type WeekDay = 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday' 
  | 'sunday';

/**
 * Age ranges for family members
 */
export type AgeRange = 
  | 'infant'      // 0-2 years
  | 'toddler'     // 2-5 years
  | 'child'       // 5-12 years
  | 'teen'        // 12-18 years
  | 'adult';      // 18+ years

/**
 * Data retention settings
 */
export interface DataRetentionSettings {
  /** How long to keep user activity logs (in days) */
  activityLogRetentionDays: number;
  /** Whether to automatically delete old photos */
  autoDeletePhotos: boolean;
  /** Photo retention period (in days) */
  photoRetentionDays?: number;
  /** Whether to keep deleted items in trash */
  useTrash: boolean;
}