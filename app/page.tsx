import { MarketingLayout } from './components/marketing/layout/marketing-layout';
import { HeroSection } from './components/marketing/sections/hero-section';
import { HowItWorksSection } from './components/marketing/sections/how-it-works-section';
import { TestimonialsSection } from './components/marketing/sections/testimonials-section';
import { FreePreviewSection } from './components/marketing/sections/free-preview-section';
import { DifferentiationSection } from './components/marketing/sections/differentiation-section';
import { SocialProofSection } from './components/marketing/sections/social-proof-section';
import { FinalCtaSection } from './components/marketing/sections/final-cta-section';
import { homepageContent } from './lib/content/homepage';
import { mockTestimonials } from './lib/content/testimonials-data';
import { mockResources } from './lib/content/resources-data';

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
      <div id="features">
        <FreePreviewSection resources={mockResources} />
        <DifferentiationSection />
        <SocialProofSection />
      </div>
      <FinalCtaSection />
    </MarketingLayout>
  );
}
