import { MarketingLayout } from './components/marketing/layout/marketing-layout';
import { HeroSection } from './components/marketing/sections/hero-section';
import { HowItWorksSection } from './components/marketing/sections/how-it-works-section';
import { TestimonialsSection } from './components/marketing/sections/testimonials-section';
import { FreePreviewSection } from './components/marketing/sections/free-preview-section';
import { DifferentiationSection } from './components/marketing/sections/differentiation-section';
import { SocialProofSection } from './components/marketing/sections/social-proof-section';
import { FinalCtaSection } from './components/marketing/sections/final-cta-section';
import { homepageContent } from './lib/content/homepage';
import { AvatarSource, ResourceCategory } from './lib/types/marketing';

// Mock data for now - will be replaced with actual content data
const mockTestimonials = [
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

const mockResources = [
  {
    id: '1',
    title: 'Family Gratitude Journal',
    description: 'Beautiful printable pages to help families reflect together',
    category: ResourceCategory.CONVERSATION_STARTERS,
    thumbnailImage: '/images/gratitude-journal-thumb.jpg',
    downloadUrl: '/resources/gratitude-journal.pdf',
    isPremium: false,
    fileFormat: 'PDF',
    fileSize: 2048
  },
  {
    id: '2',
    title: 'Nature Scavenger Hunt',
    description: 'Get outside and explore nature together with this fun activity',
    category: ResourceCategory.ACTIVITY_GUIDES,
    thumbnailImage: '/images/nature-hunt-thumb.jpg',
    downloadUrl: '/resources/nature-scavenger-hunt.pdf',
    isPremium: false,
    fileFormat: 'PDF',
    fileSize: 1536
  },
  {
    id: '3',
    title: 'Bedtime Story Prompts',
    description: 'Creative prompts to make bedtime stories more engaging',
    category: ResourceCategory.BEDTIME_ROUTINES,
    thumbnailImage: '/images/bedtime-prompts-thumb.jpg',
    downloadUrl: '/resources/bedtime-prompts.pdf',
    isPremium: false,
    fileFormat: 'PDF',
    fileSize: 1024
  }
];

export default function Home() {
  const heroContent = homepageContent.sections.find(s => s.type === 'hero')?.content.hero;
  const howItWorksContent = homepageContent.sections.find(s => s.type === 'how-it-works')?.content.howItWorks;

  if (!heroContent || !howItWorksContent) {
    return <div>Loading...</div>;
  }

  return (
    <MarketingLayout>
      <HeroSection content={heroContent} />
      <HowItWorksSection content={howItWorksContent} />
      <TestimonialsSection testimonials={mockTestimonials} />
      <FreePreviewSection resources={mockResources} />
      <DifferentiationSection />
      <SocialProofSection />
      <FinalCtaSection />
    </MarketingLayout>
  );
}
