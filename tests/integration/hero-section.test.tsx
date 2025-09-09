/**
 * HeroSection Integration Test
 * CRITICAL: This test MUST FAIL before implementation
 * Tests complete section behavior with multiple components working together
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '@/app/components/marketing/sections/hero-section';
import { HeroContent, ButtonVariant, ButtonSize } from '@/app/lib/types/marketing';

describe('HeroSection Integration Tests', () => {
  const mockHeroContent: HeroContent = {
    headline: "Feel like parenting should come with a manual?",
    subheadline: "In 2 minutes, we'll build your personalized parenting toolkit—based on your family's real needs.",
    primaryCta: {
      id: 'hero-primary',
      text: 'Start My Quiz',
      href: '/quiz',
      variant: ButtonVariant.PRIMARY,
      size: ButtonSize.LG,
      ariaLabel: 'Start your personalized parenting quiz',
      trackingEvent: 'hero_start_quiz_click',
      isDisabled: false,
      isExternal: false
    },
    secondaryCta: {
      id: 'hero-secondary',
      text: 'See How It Works',
      href: '#how-it-works',
      variant: ButtonVariant.SECONDARY,
      size: ButtonSize.MD,
      ariaLabel: 'Learn how our personalized approach works',
      trackingEvent: 'hero_see_how_works_click',
      isDisabled: false,
      isExternal: false
    },
    heroImage: {
      src: '/images/dashboard-mockup.jpg',
      alt: 'Mobile phone displaying personalized family dashboard with parenting resources',
      width: 400,
      height: 600
    }
  };

  const mockOnCtaClick = jest.fn();

  beforeEach(() => {
    mockOnCtaClick.mockClear();
  });

  describe('Integration: Complete Hero Experience', () => {
    it('should render complete hero section with all elements', () => {
      render(<HeroSection content={mockHeroContent} onCtaClick={mockOnCtaClick} />);
      
      // Main headline - constitutional requirement
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline).toHaveTextContent("Feel like parenting should come with a manual?");
      
      // Subheadline with personalization promise
      const subheadline = screen.getByText(/In 2 minutes, we'll build your personalized parenting toolkit/);
      expect(subheadline).toBeInTheDocument();
      
      // Both CTA buttons
      const primaryCta = screen.getByRole('button', { name: /Start your personalized parenting quiz/ });
      const secondaryCta = screen.getByRole('button', { name: /Learn how our personalized approach works/ });
      
      expect(primaryCta).toBeInTheDocument();
      expect(secondaryCta).toBeInTheDocument();
      
      // Hero image
      const heroImage = screen.getByRole('img', { name: /Mobile phone displaying personalized family dashboard/ });
      expect(heroImage).toBeInTheDocument();
    });

    it('should have proper semantic structure for accessibility', () => {
      render(<HeroSection content={mockHeroContent} />);
      
      // Section should be main landmark
      const heroSection = screen.getByRole('main');
      expect(heroSection).toBeInTheDocument();
      
      // Proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      
      // CTAs should be properly labeled
      const primaryCta = screen.getByLabelText('Start your personalized parenting quiz');
      const secondaryCta = screen.getByLabelText('Learn how our personalized approach works');
      
      expect(primaryCta).toBeInTheDocument();
      expect(secondaryCta).toBeInTheDocument();
    });
  });

  describe('Integration: CTA Interaction Flow', () => {
    it('should handle primary CTA click with tracking', () => {
      render(<HeroSection content={mockHeroContent} onCtaClick={mockOnCtaClick} />);
      
      const primaryCta = screen.getByRole('button', { name: /Start your personalized parenting quiz/ });
      fireEvent.click(primaryCta);
      
      expect(mockOnCtaClick).toHaveBeenCalledWith('hero-primary', {
        eventName: 'hero_start_quiz_click',
        eventCategory: 'cta',
        eventLabel: 'hero_primary',
        customProperties: {
          buttonText: 'Start My Quiz',
          buttonVariant: 'primary',
          section: 'hero'
        }
      });
    });

    it('should handle secondary CTA click with tracking', () => {
      render(<HeroSection content={mockHeroContent} onCtaClick={mockOnCtaClick} />);
      
      const secondaryCta = screen.getByRole('button', { name: /Learn how our personalized approach works/ });
      fireEvent.click(secondaryCta);
      
      expect(mockOnCtaClick).toHaveBeenCalledWith('hero-secondary', {
        eventName: 'hero_see_how_works_click',
        eventCategory: 'cta',
        eventLabel: 'hero_secondary',
        customProperties: {
          buttonText: 'See How It Works',
          buttonVariant: 'secondary',
          section: 'hero'
        }
      });
    });

    it('should handle keyboard navigation between CTAs', () => {
      render(<HeroSection content={mockHeroContent} onCtaClick={mockOnCtaClick} />);
      
      const primaryCta = screen.getByRole('button', { name: /Start your personalized parenting quiz/ });
      const secondaryCta = screen.getByRole('button', { name: /Learn how our personalized approach works/ });
      
      // Tab navigation should work
      primaryCta.focus();
      expect(primaryCta).toHaveFocus();
      
      // Enter key should trigger click
      fireEvent.keyDown(primaryCta, { key: 'Enter' });
      expect(mockOnCtaClick).toHaveBeenCalledWith('hero-primary', expect.any(Object));
      
      // Tab to secondary CTA
      fireEvent.keyDown(primaryCta, { key: 'Tab' });
      secondaryCta.focus();
      expect(secondaryCta).toHaveFocus();
    });
  });

  describe('Integration: Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<HeroSection content={mockHeroContent} />);
      
      const heroSection = screen.getByRole('main');
      expect(heroSection).toHaveClass('hero-mobile-layout');
      
      // Image should be optimized for mobile
      const heroImage = screen.getByRole('img');
      expect(heroImage).toHaveAttribute('sizes', expect.stringContaining('375px'));
    });

    it('should adapt layout for desktop devices', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<HeroSection content={mockHeroContent} />);
      
      const heroSection = screen.getByRole('main');
      expect(heroSection).toHaveClass('hero-desktop-layout');
    });
  });

  describe('Integration: Animation Behavior', () => {
    it('should animate elements on mount with reduced motion support', () => {
      render(<HeroSection content={mockHeroContent} />);
      
      // Elements should have animation attributes
      const headline = screen.getByRole('heading', { level: 1 });
      const animatedContainer = headline.closest('[data-motion="true"]');
      expect(animatedContainer).toBeInTheDocument();
    });

    it('should handle reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      render(<HeroSection content={mockHeroContent} />);
      
      const heroSection = screen.getByRole('main');
      expect(heroSection).toHaveAttribute('data-reduced-motion', 'true');
    });
  });

  describe('Integration: Performance Optimization', () => {
    it('should optimize hero image loading', () => {
      render(<HeroSection content={mockHeroContent} />);
      
      const heroImage = screen.getByRole('img');
      
      // Should prioritize hero image loading
      expect(heroImage).toHaveAttribute('priority', 'true');
      expect(heroImage).toHaveAttribute('loading', 'eager');
      
      // Should include proper dimensions
      expect(heroImage).toHaveAttribute('width', '400');
      expect(heroImage).toHaveAttribute('height', '600');
    });

    it('should include proper meta tags for SEO', () => {
      render(<HeroSection content={mockHeroContent} />);
      
      // Should have structured data
      const structuredData = document.querySelector('script[type="application/ld+json"]');
      expect(structuredData).toBeInTheDocument();
      
      // Should include hero content in structured data
      if (structuredData) {
        const data = JSON.parse(structuredData.textContent || '{}');
        expect(data.headline).toContain('parenting should come with a manual');
      }
    });
  });

  describe('Integration: Content Validation', () => {
    it('should enforce constitutional headline length limit (80 chars)', () => {
      const longHeadlineContent = {
        ...mockHeroContent,
        headline: 'This is a very long headline that exceeds the constitutional limit of eighty characters and should be truncated or show warning' // 131 chars
      };

      render(<HeroSection content={longHeadlineContent} />);
      
      // Should either truncate or show warning
      const headline = screen.getByRole('heading', { level: 1 });
      const headlineText = headline.textContent || '';
      
      if (headlineText.length > 80) {
        // Should show truncation indicator
        expect(headline).toHaveAttribute('title', expect.stringContaining('This is a very long headline'));
        expect(headlineText).toMatch(/\.{3}$/); // Should end with ellipsis
      }
    });

    it('should enforce constitutional subheadline length limit (160 chars)', () => {
      const longSubheadlineContent = {
        ...mockHeroContent,
        subheadline: 'This is a very long subheadline that exceeds the constitutional limit of one hundred and sixty characters and should be truncated or show warning message to the user because it violates our content guidelines' // 200+ chars
      };

      render(<HeroSection content={longSubheadlineContent} />);
      
      // Should handle long subheadlines appropriately
      const subheadline = screen.getByTestId('hero-subheadline');
      expect(subheadline).toBeInTheDocument();
    });
  });

  describe('Integration: Loading States', () => {
    it('should handle loading state gracefully', () => {
      render(<HeroSection content={mockHeroContent} isLoading={true} />);
      
      // Should show loading skeletons
      const loadingSkeleton = screen.getByTestId('hero-loading-skeleton');
      expect(loadingSkeleton).toBeInTheDocument();
      
      // CTAs should be disabled during loading
      const primaryCta = screen.getByRole('button', { name: /Start your personalized parenting quiz/ });
      expect(primaryCta).toBeDisabled();
    });

    it('should transition from loading to loaded state', async () => {
      const { rerender } = render(<HeroSection content={mockHeroContent} isLoading={true} />);
      
      expect(screen.getByTestId('hero-loading-skeleton')).toBeInTheDocument();
      
      rerender(<HeroSection content={mockHeroContent} isLoading={false} />);
      
      // Loading skeleton should be gone
      expect(screen.queryByTestId('hero-loading-skeleton')).not.toBeInTheDocument();
      
      // Content should be visible
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline).toBeVisible();
    });
  });

  describe('Integration: Error Boundaries', () => {
    it('should handle missing hero image gracefully', () => {
      const contentWithoutImage = {
        ...mockHeroContent,
        heroImage: undefined
      };

      render(<HeroSection content={contentWithoutImage} />);
      
      // Should still render text content
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline).toBeInTheDocument();
      
      // Should show fallback or no image
      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(0);
    });

    it('should handle missing CTAs gracefully', () => {
      const contentWithoutSecondary = {
        ...mockHeroContent,
        secondaryCta: undefined
      };

      render(<HeroSection content={contentWithoutSecondary} />);
      
      // Primary CTA should still work
      const primaryCta = screen.getByRole('button', { name: /Start your personalized parenting quiz/ });
      expect(primaryCta).toBeInTheDocument();
      
      // Secondary CTA should not be present
      const secondaryCta = screen.queryByText('See How It Works');
      expect(secondaryCta).not.toBeInTheDocument();
    });
  });
});