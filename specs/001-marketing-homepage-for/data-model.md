# Data Model: Marketing Homepage Components

**Date**: 2025-09-09  
**Status**: Complete

## Entity Definitions

Based on the feature specification and research findings, the marketing homepage requires the following data entities to support static content management and user interactions.

---

## 1. MarketingContent

**Purpose**: Central content structure for all homepage copy and messaging

**Fields**:
- `headline`: string - Main hero headline ("Feel like parenting should come with a manual?")
- `subheadline`: string - Supporting hero text (2-minute toolkit promise)
- `sections`: HomepageSection[] - Ordered list of page sections
- `metadata`: SEOMetadata - Page meta information for search optimization

**Validation Rules**:
- Headline max 80 characters (optimal for SEO)
- Subheadline max 160 characters
- All text must pass inclusive language guidelines
- Required accessibility attributes included

**State Transitions**: Static content - no state changes

---

## 2. HomepageSection

**Purpose**: Individual section components with content and configuration

**Fields**:
- `id`: string - Unique section identifier
- `type`: SectionType - Section component type (hero, how-it-works, testimonials, etc.)
- `title`: string - Section heading
- `content`: SectionContent - Type-specific content structure
- `isVisible`: boolean - Section visibility toggle
- `order`: number - Display order on page

**Validation Rules**:
- Section order must be sequential without gaps
- Content structure must match section type requirements
- Title required for screen reader navigation

**Relationships**:
- Belongs to MarketingContent
- Contains CTAButton elements
- May contain TestimonialItem or ResourcePreview collections

---

## 3. CTAButton

**Purpose**: Call-to-action elements with tracking and accessibility

**Fields**:
- `id`: string - Unique button identifier  
- `text`: string - Button display text
- `href`: string - Destination URL or route
- `variant`: ButtonVariant - Visual style (primary, secondary, outline)
- `size`: ButtonSize - Size specification (sm, md, lg)
- `ariaLabel`: string - Accessibility label
- `trackingEvent`: string - Analytics event name
- `isDisabled`: boolean - Button state

**Validation Rules**:
- Text max 30 characters for mobile optimization
- href must be valid URL or Next.js route
- ariaLabel required when text is ambiguous
- Primary CTAs limited to 2 per section maximum

**State Transitions**:
- Default → Hover → Active
- Enabled ↔ Disabled

---

## 4. TestimonialItem

**Purpose**: User testimonials with privacy-compliant attribution

**Fields**:
- `id`: string - Unique testimonial identifier
- `quote`: string - Testimonial text content
- `attribution`: Attribution - Author information
- `avatar`: Avatar - Display image information
- `familyContext`: string - Family structure context ("co-parent of twins")
- `location`: string - Geographic attribution ("Denver, CO")
- `isVerified`: boolean - Consent verification status

**Validation Rules**:
- Quote max 280 characters for readability
- Attribution must not include full names (privacy)
- Avatar must be AI-generated or stock image (no real photos)
- Location limited to city/state level
- isVerified must be true for display

**Relationships**:
- Used in TestimonialsSection
- Contains Avatar entity
- Contains Attribution entity

---

## 5. Avatar

**Purpose**: AI-generated or stock image representation for testimonials

**Fields**:
- `id`: string - Unique avatar identifier
- `filename`: string - Image file name
- `altText`: string - Accessibility description
- `demographics`: Demographics - Representation attributes
- `source`: AvatarSource - Generation method (ai-generated, stock, illustration)
- `optimizedVersions`: ImageVariant[] - Different sizes/formats for performance

**Validation Rules**:
- All images must be AI-generated or licensed stock photos
- No real user photos permitted (constitutional requirement)
- altText required and descriptive
- Must include optimized WebP/AVIF versions
- Demographics must support inclusive representation

**Performance Requirements**:
- Original: Max 100KB before optimization
- WebP version: Target 5-10KB
- Blur placeholder data URL included

---

## 6. Attribution

**Purpose**: Privacy-compliant testimonial attribution

**Fields**:
- `displayName`: string - First name + last initial ("Sarah M.")
- `familyRole`: string - Role descriptor ("co-parent", "single mom")
- `childrenContext`: string - Family context ("twins", "3 kids ages 5-12")
- `location`: string - City/state only
- `consentDate`: Date - When permission was granted
- `consentMethod`: string - How consent was obtained

**Validation Rules**:
- No full names permitted (privacy protection)
- familyRole must be from approved list
- childrenContext must not identify specific children
- Location limited to city/state (no addresses)
- Valid consent required before display

---

## 7. ResourcePreview

**Purpose**: Sample downloadable materials showcase

**Fields**:
- `id`: string - Unique resource identifier
- `title`: string - Resource name ("Weekly Meal Planner")
- `description`: string - Brief description
- `category`: ResourceCategory - Type classification
- `thumbnailImage`: string - Preview image path
- `downloadUrl`: string - File download location (if available)
- `isPremium`: boolean - Availability tier
- `fileFormat`: string - Document type (PDF, etc.)

**Validation Rules**:
- Title max 50 characters
- Description max 120 characters  
- Thumbnail required and optimized
- downloadUrl validated for security
- Category must be from approved list

**Categories**:
- meal-planning
- bedtime-routines
- activity-guides
- conversation-starters
- calm-techniques

---

## 8. SocialProofElement

**Purpose**: Credibility indicators with legal compliance

**Fields**:
- `id`: string - Unique element identifier
- `type`: ProofType - Type of social proof
- `displayValue`: string - Shown to users
- `actualValue`: number - Real metric (if applicable)
- `lastUpdated`: Date - When metric was verified
- `source`: string - Data source or methodology
- `hasPermission`: boolean - Legal clearance status
- `disclaimer`: string - Required disclosure text

**Validation Rules**:
- displayValue must be truthful and substantiated
- actualValue required for metrics claims
- source documentation required for all claims
- Permission required for third-party references
- Disclaimer required when using projections

**Types**:
- user-count
- satisfaction-rating
- media-mention
- expert-endorsement
- community-growth

---

## 9. NavigationItem

**Purpose**: Header navigation links with availability status

**Fields**:
- `id`: string - Unique nav item identifier
- `label`: string - Display text
- `href`: string - Destination URL
- `isAvailable`: boolean - Whether destination exists
- `isExternal`: boolean - External link indicator
- `order`: number - Navigation order
- `accessLevel`: AccessLevel - Required user permissions

**Validation Rules**:
- Label max 20 characters for mobile nav
- href validated for security
- Unavailable items show appropriate state
- External links include security attributes

**State Handling**:
- Available destinations: Normal link behavior
- Unavailable destinations: Show "Coming Soon" state or disabled state
- External links: Open in new tab with security attributes

---

## Type Definitions

```typescript
// Supporting types for the data model

enum SectionType {
  HERO = 'hero',
  HOW_IT_WORKS = 'how-it-works', 
  TESTIMONIALS = 'testimonials',
  FREE_PREVIEW = 'free-preview',
  DIFFERENTIATION = 'differentiation',
  SOCIAL_PROOF = 'social-proof',
  FINAL_CTA = 'final-cta'
}

enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline'
}

enum ButtonSize {
  SM = 'sm',
  MD = 'md', 
  LG = 'lg'
}

enum AvatarSource {
  AI_GENERATED = 'ai-generated',
  STOCK_PHOTO = 'stock-photo',
  ILLUSTRATION = 'illustration'
}

enum ResourceCategory {
  MEAL_PLANNING = 'meal-planning',
  BEDTIME_ROUTINES = 'bedtime-routines',
  ACTIVITY_GUIDES = 'activity-guides',
  CONVERSATION_STARTERS = 'conversation-starters',
  CALM_TECHNIQUES = 'calm-techniques'
}

enum ProofType {
  USER_COUNT = 'user-count',
  SATISFACTION_RATING = 'satisfaction-rating',
  MEDIA_MENTION = 'media-mention',
  EXPERT_ENDORSEMENT = 'expert-endorsement',
  COMMUNITY_GROWTH = 'community-growth'
}

enum AccessLevel {
  PUBLIC = 'public',
  REGISTERED = 'registered',
  PREMIUM = 'premium'
}
```

---

## Privacy & Security Considerations

**Constitutional Compliance**:
- ✅ No child PII collection in any entity
- ✅ Data minimization in testimonial attribution
- ✅ Explicit consent tracking for all user-generated content
- ✅ AI-generated avatars eliminate privacy risks

**Security Measures**:
- URL validation for all href fields
- File upload restrictions for resource previews
- Content sanitization for all text fields
- Permission verification for social proof elements

**Accessibility Features**:
- Required altText for all images
- ARIA labels for interactive elements
- Screen reader-friendly content structure
- Keyboard navigation support

---

This data model supports the complete marketing homepage functionality while maintaining strict compliance with Familying.org's constitutional requirements for privacy, accessibility, and ethical content management.