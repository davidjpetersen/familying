/**
 * Testimonials Mock Data
 * Constitutional compliance: Privacy-first testimonials with AI-generated avatars
 */

import { TestimonialItem, AvatarSource } from '@/app/lib/types/marketing';

export const mockTestimonials: TestimonialItem[] = [
  {
    id: '1',
    quote: 'Familying.org has transformed our family time. My kids actually ask to do these activities together!',
    attribution: {
      displayName: 'Sarah M.',
      familyRole: 'Mother',
      childrenContext: '3 children',
      location: 'California',
      consentDate: new Date('2024-01-15'),
      consentMethod: 'email_verified'
    },
    avatar: {
      id: 'sarah-m',
      filename: 'sarah-m-avatar.jpg',
      altText: 'Profile photo of Sarah M.',
      demographics: {
        ageRange: '35-44',
        familyStructure: 'nuclear_family'
      },
      source: AvatarSource.AI_GENERATED,
      optimizedVersions: []
    },
    familyContext: 'Mother of 3 children',
    location: 'California',
    isVerified: true
  },
  {
    id: '2', 
    quote: 'I love that I can download activities without giving my email. Finally, a family site that respects privacy.',
    attribution: {
      displayName: 'Michael T.',
      familyRole: 'Father',
      childrenContext: '2 children',
      location: 'Texas',
      consentDate: new Date('2024-01-20'),
      consentMethod: 'email_verified'
    },
    avatar: {
      id: 'michael-t',
      filename: 'michael-t-avatar.jpg',
      altText: 'Profile photo of Michael T.',
      demographics: {
        ageRange: '25-34',
        familyStructure: 'nuclear_family'
      },
      source: AvatarSource.AI_GENERATED,
      optimizedVersions: []
    },
    familyContext: 'Father of 2 children',
    location: 'Texas',
    isVerified: true
  },
  {
    id: '3',
    quote: 'The activities are so well-designed. Perfect for screen-free time that actually engages the whole family.',
    attribution: {
      displayName: 'Jenny L.',
      familyRole: 'Mother',
      childrenContext: '1 child',
      location: 'New York',
      consentDate: new Date('2024-02-01'),
      consentMethod: 'email_verified'
    },
    avatar: {
      id: 'jenny-l',
      filename: 'jenny-l-avatar.jpg',
      altText: 'Profile photo of Jenny L.',
      demographics: {
        ageRange: '35-44',
        familyStructure: 'single_parent'
      },
      source: AvatarSource.AI_GENERATED,
      optimizedVersions: []
    },
    familyContext: 'Mother of 1 child',
    location: 'New York',
    isVerified: true
  }
];