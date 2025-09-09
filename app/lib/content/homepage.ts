/**
 * Marketing Homepage Content Structure
 * Constitutional compliance: Privacy-first, inclusive messaging, evidence-based claims
 * Based on specification requirements and research findings
 */

import { 
  MarketingContent, 
  SectionType, 
  ButtonVariant, 
  ButtonSize,
  CTAButton
} from "@/app/lib/types/marketing";

// Primary CTA button template
const createPrimaryCTA = (id: string, text: string = "Start My Quiz"): CTAButton => ({
  id,
  text,
  href: "/quiz", // TODO: Update with actual quiz route
  variant: ButtonVariant.PRIMARY,
  size: ButtonSize.LG,
  ariaLabel: `${text} - Begin your personalized parenting toolkit`,
  trackingEvent: `cta_${id}_click`,
  isDisabled: false,
  isExternal: false
});

// Secondary CTA button template
const createSecondaryCTA = (id: string, text: string, href: string): CTAButton => ({
  id,
  text,
  href,
  variant: ButtonVariant.SECONDARY,
  size: ButtonSize.MD,
  ariaLabel: text,
  trackingEvent: `secondary_cta_${id}_click`,
  isDisabled: false,
  isExternal: false
});

// Homepage content structure
export const homepageContent: MarketingContent = {
  headline: "Feel like parenting should come with a manual?",
  subheadline: "In 2 minutes, we'll build your personalized parenting toolkit—based on your family's real needs.",
  metadata: {
    title: "Familying.org - Personalized Parenting Toolkit | Feel Supported, Not Overwhelmed",
    description: "Get your custom parenting dashboard in 2 minutes. Evidence-based resources for every family structure. No judgment, just practical help for real parents.",
    keywords: [
      "personalized parenting advice",
      "family toolkit",
      "parenting resources",
      "inclusive parenting",
      "evidence-based parenting",
      "co-parenting support",
      "single parent resources"
    ],
    ogImage: "/images/og-homepage.jpg", // TODO: Create OG image
    canonicalUrl: "https://familying.org"
  },
  sections: [
    {
      id: "hero",
      type: SectionType.HERO,
      title: "Hero Section",
      isVisible: true,
      order: 1,
      content: {
        hero: {
          headline: "Feel like parenting should come with a manual?",
          subheadline: "In 2 minutes, we'll build your personalized parenting toolkit—based on your family's real needs.",
          primaryCta: createPrimaryCTA("hero_primary", "Start My Quiz"),
          secondaryCta: createSecondaryCTA("hero_secondary", "See How It Works", "#how-it-works"),
          heroImage: {
            src: "/images/dashboard-mockup.jpg", // TODO: Create mobile mockup image
            alt: "Mobile phone displaying personalized family dashboard with parenting resources",
            width: 400,
            height: 600
          }
        }
      }
    },
    {
      id: "how-it-works",
      type: SectionType.HOW_IT_WORKS,
      title: "How It Works",
      isVisible: true,
      order: 2,
      content: {
        howItWorks: {
          animationEnabled: true,
          steps: [
            {
              id: "step-1",
              stepNumber: 1,
              title: "Take the 2-minute quiz",
              description: "Tell us about your family's unique needs, challenges, and what's working.",
              icon: "CheckSquare" // Lucide React icon name
            },
            {
              id: "step-2", 
              stepNumber: 2,
              title: "Get your custom dashboard",
              description: "Receive a personalized hub with resources tailored to your household.",
              icon: "Layout" // Lucide React icon name
            },
            {
              id: "step-3",
              stepNumber: 3,
              title: "Access tips, tools, and printable resources",
              description: "Download meal planners, bedtime scripts, and activities made for your family.",
              icon: "Download" // Lucide React icon name
            }
          ]
        }
      }
    },
    {
      id: "testimonials",
      type: SectionType.TESTIMONIALS,
      title: "What Families Are Saying",
      isVisible: true,
      order: 3,
      content: {
        testimonials: {
          displayStyle: "carousel",
          testimonials: [] // Will be populated from testimonials-data.ts
        }
      }
    },
    {
      id: "free-preview",
      type: SectionType.FREE_PREVIEW,
      title: "Get a Taste of What's Inside",
      isVisible: true,
      order: 4,
      content: {
        freePreview: {
          title: "Get a Taste of What's Inside",
          description: "Download these sample resources to see how Familying can help your household thrive.",
          resources: [], // Will be populated from resources-data.ts
          cta: createPrimaryCTA("free_preview", "Get Your Free Toolkit")
        }
      }
    },
    {
      id: "differentiation",
      type: SectionType.DIFFERENTIATION,
      title: "What Makes Us Different",
      isVisible: true,
      order: 5,
      content: {
        differentiation: {
          title: "What Makes Us Different",
          comparison: [
            {
              category: "Approach",
              competitors: "One-size-fits-all advice",
              familying: "Personalized for your family structure"
            },
            {
              category: "Tone",
              competitors: "Preachy or judgmental",
              familying: "Warm, playful, and choice-preserving"
            },
            {
              category: "Evidence",
              competitors: "Opinion-based content",
              familying: "Research-backed with cited sources"
            },
            {
              category: "Privacy", 
              competitors: "Data collection and ads",
              familying: "Privacy-first with transparent policies"
            }
          ],
          highlights: [
            "Evidence-based resources with credible sources",
            "Playful and warm tone that avoids shame",
            "Inclusive of all family structures and styles",
            "Private and secure - your data stays yours"
          ]
        }
      }
    },
    {
      id: "social-proof",
      type: SectionType.SOCIAL_PROOF,
      title: "Trusted by Families Everywhere",
      isVisible: true,
      order: 6,
      content: {
        socialProof: {
          layout: "horizontal",
          elements: [] // Will be populated from social-proof-data.ts
        }
      }
    },
    {
      id: "final-cta",
      type: SectionType.FINAL_CTA,
      title: "Ready to Start?",
      isVisible: true,
      order: 7,
      content: {
        finalCta: {
          headline: "Start building the kind of family life you want",
          description: "Join thousands of families who've found their personalized parenting approach.",
          cta: createPrimaryCTA("final_cta", "Start My Quiz"),
          backgroundColor: "bg-primary"
        }
      }
    }
  ]
};

// Navigation items with availability status
export const publicNavigationItems = [
  {
    id: "features",
    label: "Features",
    href: "/#features", // Link to features section on homepage
    isAvailable: true,
    isExternal: false
  },
  {
    id: "subscribe",
    label: "Subscribe",
    href: "/subscription",
    isAvailable: true,
    isExternal: false
  }
];

export const authenticatedNavigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/my-cookbook", // Using existing page as dashboard for now
    isAvailable: true,
    isExternal: false
  }
];

// Legacy navigation items - keeping for backwards compatibility
export const navigationItems = [
  {
    id: "subscribe",
    label: "Subscribe",
    href: "/subscribe",
    isAvailable: false, // Coming soon
    isExternal: false,
    order: 4,
    accessLevel: "public" as const
  },
  {
    id: "log-in",
    label: "Log In",
    href: "/sign-in",
    isAvailable: true, // Clerk auth available
    isExternal: false,
    order: 5,
    accessLevel: "public" as const
  }
];

// Logo configuration with heart icons
export const logoConfig = {
  text: "Familying",
  showHeartIcons: true, // Playful heart icons over 'i's as per spec
  href: "/",
  ariaLabel: "Familying.org - Personalized parenting toolkit"
};