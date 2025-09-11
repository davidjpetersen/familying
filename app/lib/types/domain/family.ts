/**
 * Family Domain Types
 * 
 * Core types related to family organization structure and members
 */

import type { DataRetentionSettings } from '../shared/common';

/**
 * Family Organization
 * Represents a family unit managed through Clerk Organizations
 */
export interface FamilyOrganization {
  /** Unique organization identifier */
  id: string;
  /** Family display name */
  name: string;
  /** URL-safe slug for routing */
  slug: string;
  /** Family avatar/photo URL */
  imageUrl?: string;
  /** Organization creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
  /** Number of family members */
  membersCount: number;
  /** Family-specific settings and preferences */
  publicMetadata: FamilyPublicMetadata;
  /** Private family configuration */
  privateMetadata: FamilyPrivateMetadata;
}

/**
 * Individual family member
 * Represents a member within a family organization
 */
export interface FamilyMember {
  /** Unique member identifier */
  id: string;
  /** Member's role within the family */
  role: FamilyRole;
  /** When the member joined the family */
  joinedAt: Date;
  /** Member's profile information from Clerk */
  profile: {
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    emailAddress?: string;
  };
}

/**
 * Available roles within a family organization
 */
export type FamilyRole = 'admin' | 'basic_member';

/**
 * Public metadata stored with the organization
 * This data is accessible to all organization members
 */
export interface FamilyPublicMetadata {
  /** Family description or motto */
  description?: string;
  /** Family location (city, state, country) */
  location?: string;
  /** Family website or social media */
  website?: string;
  /** Family established date */
  establishedDate?: string;
  /** Family categories/interests */
  interests?: string[];
  /** Public family statistics */
  stats?: {
    recipesShared?: number;
    eventsPlanned?: number;
    photosUploaded?: number;
  };
  /** Family visibility settings */
  visibility?: {
    showMemberCount: boolean;
    showEstablishedDate: boolean;
    allowDiscovery: boolean;
  };
}

/**
 * Private metadata stored with the organization
 * Only accessible to family administrators
 */
export interface FamilyPrivateMetadata {
  /** Internal family settings */
  settings?: {
    /** Data retention policies */
    dataRetention?: DataRetentionSettings;
    /** Communication preferences */
    notifications?: {
      emailUpdates: boolean;
      weeklyDigest: boolean;
      memberJoined: boolean;
    };
    /** Feature flags for the family */
    features?: {
      recipesEnabled: boolean;
      eventsEnabled: boolean;
      photosEnabled: boolean;
      chatEnabled: boolean;
    };
  };
  /** Administrative notes (not visible to regular members) */
  adminNotes?: string;
}