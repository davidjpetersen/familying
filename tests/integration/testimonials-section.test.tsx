/**
 * TestimonialsSection Integration Test
 * CRITICAL: This test MUST FAIL before implementation
 * Tests testimonials carousel with constitutional privacy compliance
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestimonialsSection } from '@/app/components/marketing/sections/testimonials-section';
import { 
  TestimonialContent, 
  TestimonialItem, 
  Attribution, 
  Avatar, 
  AvatarSource,
  Demographics 
} from '@/app/lib/types/marketing';

describe('TestimonialsSection Integration Tests', () => {
  const mockDemographics: Demographics = {
    ageRange: '30-40',
    familyStructure: 'co-parent',
    ethnicity: 'diverse',
    accessibility: 'none'
  };

  const mockAvatar1: Avatar = {
    id: 'avatar-1',
    filename: 'parent-avatar-1.webp',
    altText: 'AI-generated avatar of a diverse co-parent',
    demographics: mockDemographics,
    source: AvatarSource.AI_GENERATED,
    optimizedVersions: [
      {
        format: 'webp',
        width: 80,
        height: 80,
        url: '/avatars/parent-avatar-1.webp',
        size: 8192,
        blurDataUrl: 'data:image/jpeg;base64,/9j/mock...'
      }
    ]
  };

  const mockAvatar2: Avatar = {
    id: 'avatar-2',
    filename: 'parent-avatar-2.webp',
    altText: 'AI-generated avatar of a single parent',
    demographics: { ...mockDemographics, familyStructure: 'single-parent' },
    source: AvatarSource.AI_GENERATED,
    optimizedVersions: [
      {
        format: 'webp',
        width: 80,
        height: 80,
        url: '/avatars/parent-avatar-2.webp',
        size: 7892
      }
    ]
  };

  const mockTestimonials: TestimonialItem[] = [
    {
      id: 'testimonial-1',
      quote: 'I felt so seen. Finally, something for co-parents that actually gets our unique challenges.',
      attribution: {
        displayName: 'Sarah M.',
        familyRole: 'co-parent',
        childrenContext: 'twins, ages 5-7',
        location: 'Denver, CO',
        consentDate: new Date('2023-10-01'),
        consentMethod: 'email_consent'
      },
      avatar: mockAvatar1,
      familyContext: 'co-parent of twins',
      location: 'Denver, CO',
      isVerified: true
    },
    {
      id: 'testimonial-2',
      quote: 'The personalized approach made all the difference. No more one-size-fits-all parenting advice.',
      attribution: {
        displayName: 'Maria L.',
        familyRole: 'single mom',
        childrenContext: '2 kids, ages 3-8',
        location: 'Austin, TX',
        consentDate: new Date('2023-11-15'),
        consentMethod: 'web_form_consent'
      },
      avatar: mockAvatar2,
      familyContext: 'single mom of 2',
      location: 'Austin, TX',
      isVerified: true
    },
    {
      id: 'testimonial-3',
      quote: 'As a blended family, we needed something that understood our complexity. This delivered.',
      attribution: {
        displayName: 'Jordan K.',
        familyRole: 'blended family parent',
        childrenContext: '4 kids, blended household',
        location: 'Seattle, WA',
        consentDate: new Date('2023-12-01'),
        consentMethod: 'phone_consent'
      },
      avatar: { ...mockAvatar1, id: 'avatar-3', demographics: { ...mockDemographics, familyStructure: 'blended-family' } },
      familyContext: 'blended family with 4 kids',
      location: 'Seattle, WA',
      isVerified: true
    }
  ];

  const mockContent: TestimonialContent = {
    testimonials: mockTestimonials,
    displayStyle: 'carousel'
  };

  const mockOnTestimonialView = jest.fn();

  beforeEach(() => {
    mockOnTestimonialView.mockClear();
  });

  describe('Integration: Complete Testimonials Experience', () => {
    it('should render section with all testimonials', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      // Section heading
      const sectionHeading = screen.getByRole('heading', { level: 2 });
      expect(sectionHeading).toHaveTextContent(/what families are saying/i);
      
      // All testimonials should be accessible (even if not all visible in carousel)
      const testimonialQuote1 = screen.getByText(/I felt so seen/);
      expect(testimonialQuote1).toBeInTheDocument();
      
      // Attribution should be present
      const attribution1 = screen.getByText(/Sarah M\./);
      expect(attribution1).toBeInTheDocument();
      
      // Family context should be shown
      const familyContext1 = screen.getByText(/co-parent of twins/);
      expect(familyContext1).toBeInTheDocument();
      
      // Location should be present
      const location1 = screen.getByText(/Denver, CO/);
      expect(location1).toBeInTheDocument();
    });

    it('should have proper semantic structure for accessibility', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      // Section should be a landmark
      const section = screen.getByRole('region', { name: /testimonials/i });
      expect(section).toBeInTheDocument();
      
      // Should use blockquote for testimonials
      const blockquotes = screen.getAllByRole('blockquote');
      expect(blockquotes.length).toBeGreaterThan(0);
      
      // Each testimonial should be an article
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBeGreaterThan(0);
    });
  });

  describe('Integration: Constitutional Privacy Compliance', () => {
    it('should ONLY display AI-generated avatars (constitutional requirement)', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      const avatarImages = screen.getAllByRole('img');
      avatarImages.forEach(img => {
        expect(img).toHaveAttribute('data-source', 'ai-generated');
        expect(img.getAttribute('src')).toMatch(/\/avatars\/.*\.webp/);
      });
    });

    it('should NEVER display real user photos (constitutional violation check)', () => {
      const testimonialWithRealPhoto = {
        ...mockTestimonials[0],
        avatar: {
          ...mockAvatar1,
          source: AvatarSource.STOCK_PHOTO, // This should be rejected
          filename: 'real-user-photo.jpg'
        }
      };

      const contentWithRealPhoto = {
        ...mockContent,
        testimonials: [testimonialWithRealPhoto]
      };

      render(<TestimonialsSection content={contentWithRealPhoto} />);
      
      // Should either not render or show fallback avatar
      const avatarImages = screen.getAllByRole('img');
      avatarImages.forEach(img => {
        expect(img.getAttribute('src')).not.toMatch(/real-user-photo/);
        expect(img.getAttribute('src')).toMatch(/\/avatars\/.*\.webp|\/avatars\/fallback/);
      });
    });

    it('should only display first name + last initial (constitutional requirement)', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      // Should show "Sarah M." not full names
      expect(screen.getByText(/Sarah M\./)).toBeInTheDocument();
      expect(screen.getByText(/Maria L\./)).toBeInTheDocument();
      expect(screen.getByText(/Jordan K\./)).toBeInTheDocument();
      
      // Should NOT show full names
      expect(screen.queryByText(/Sarah Miller/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Maria Lopez/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Jordan Kim/)).not.toBeInTheDocument();
    });

    it('should only display city/state locations (no addresses)', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      // Should show city, state
      expect(screen.getByText(/Denver, CO/)).toBeInTheDocument();
      expect(screen.getByText(/Austin, TX/)).toBeInTheDocument();
      expect(screen.getByText(/Seattle, WA/)).toBeInTheDocument();
      
      // Should NOT show full addresses
      expect(screen.queryByText(/123 Main Street/)).not.toBeInTheDocument();
      expect(screen.queryByText(/80202/)).not.toBeInTheDocument();
    });

    it('should only display verified testimonials', () => {
      const unverifiedTestimonials = mockTestimonials.map(t => ({
        ...t,
        isVerified: false
      }));

      const contentWithUnverified = {
        ...mockContent,
        testimonials: unverifiedTestimonials
      };

      render(<TestimonialsSection content={contentWithUnverified} />);
      
      // Should show empty state or placeholder when no verified testimonials
      const emptyState = screen.getByTestId('no-verified-testimonials');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Integration: Inclusive Family Representation', () => {
    it('should display diverse family structures', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      // Co-parent representation
      expect(screen.getByText(/co-parent/)).toBeInTheDocument();
      
      // Single parent representation
      expect(screen.getByText(/single mom/)).toBeInTheDocument();
      
      // Blended family representation
      expect(screen.getByText(/blended family/)).toBeInTheDocument();
    });

    it('should use inclusive, non-judgmental language', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      // Language should be warm and specific
      expect(screen.getByText(/I felt so seen/)).toBeInTheDocument();
      expect(screen.getByText(/understood our complexity/)).toBeInTheDocument();
      
      // Should not contain judgmental language
      const allText = document.body.textContent || '';
      expect(allText).not.toMatch(/wrong|bad|fail|should have/i);
    });

    it('should represent various household configurations', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      // Different family sizes and configurations
      expect(screen.getByText(/twins, ages 5-7/)).toBeInTheDocument();
      expect(screen.getByText(/2 kids, ages 3-8/)).toBeInTheDocument();
      expect(screen.getByText(/4 kids, blended household/)).toBeInTheDocument();
    });
  });

  describe('Integration: Carousel Functionality', () => {
    it('should display testimonials in carousel format', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      const carousel = screen.getByTestId('testimonials-carousel');
      expect(carousel).toBeInTheDocument();
      
      // Navigation buttons should be present
      const prevButton = screen.getByRole('button', { name: /previous testimonial/i });
      const nextButton = screen.getByRole('button', { name: /next testimonial/i });
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should navigate between testimonials', async () => {
      render(<TestimonialsSection content={mockContent} />);
      
      // First testimonial should be visible
      expect(screen.getByText(/I felt so seen/)).toBeVisible();
      
      // Click next button
      const nextButton = screen.getByRole('button', { name: /next testimonial/i });
      fireEvent.click(nextButton);
      
      // Second testimonial should become visible
      await waitFor(() => {
        expect(screen.getByText(/personalized approach made all the difference/)).toBeVisible();
      });
    });

    it('should support autoplay with pause on hover', async () => {
      render(<TestimonialsSection content={mockContent} autoplay={true} autoplayInterval={3000} />);
      
      const carousel = screen.getByTestId('testimonials-carousel');
      
      // Should have autoplay indicator
      expect(carousel).toHaveAttribute('data-autoplay', 'true');
      
      // Hovering should pause autoplay
      fireEvent.mouseEnter(carousel);
      expect(carousel).toHaveAttribute('data-autoplay-paused', 'true');
      
      // Leaving should resume autoplay
      fireEvent.mouseLeave(carousel);
      expect(carousel).toHaveAttribute('data-autoplay-paused', 'false');
    });

    it('should support keyboard navigation', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      const carousel = screen.getByTestId('testimonials-carousel');
      carousel.focus();
      
      // Arrow keys should navigate
      fireEvent.keyDown(carousel, { key: 'ArrowRight' });
      expect(mockOnTestimonialView).toHaveBeenCalledWith('testimonial-2');
      
      fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
      expect(mockOnTestimonialView).toHaveBeenCalledWith('testimonial-1');
    });
  });

  describe('Integration: Grid Display Option', () => {
    it('should display testimonials in grid format when specified', () => {
      const gridContent = { ...mockContent, displayStyle: 'grid' as const };
      render(<TestimonialsSection content={gridContent} />);
      
      const grid = screen.getByTestId('testimonials-grid');
      expect(grid).toBeInTheDocument();
      
      // All testimonials should be visible simultaneously
      expect(screen.getByText(/I felt so seen/)).toBeVisible();
      expect(screen.getByText(/personalized approach made all the difference/)).toBeVisible();
      expect(screen.getByText(/understood our complexity/)).toBeVisible();
    });

    it('should adapt grid layout for different screen sizes', () => {
      const gridContent = { ...mockContent, displayStyle: 'grid' as const };
      
      // Mobile layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<TestimonialsSection content={gridContent} />);
      
      const grid = screen.getByTestId('testimonials-grid');
      expect(grid).toHaveClass('grid-mobile');
    });
  });

  describe('Integration: Performance Optimization', () => {
    it('should lazy load testimonial avatars', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      const avatarImages = screen.getAllByRole('img');
      avatarImages.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    it('should use optimized image formats', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      const avatarImages = screen.getAllByRole('img');
      avatarImages.forEach(img => {
        expect(img.getAttribute('src')).toMatch(/\.webp$/);
      });
    });

    it('should implement virtual scrolling for large numbers of testimonials', () => {
      const manyTestimonials = Array.from({ length: 100 }, (_, i) => ({
        ...mockTestimonials[0],
        id: `testimonial-${i}`,
        quote: `This is testimonial number ${i + 1}. Great experience!`
      }));

      const contentWithMany = { ...mockContent, testimonials: manyTestimonials };
      render(<TestimonialsSection content={contentWithMany} />);
      
      const carousel = screen.getByTestId('testimonials-carousel');
      expect(carousel).toHaveAttribute('data-virtual-scrolling', 'true');
    });
  });

  describe('Integration: Accessibility Features', () => {
    it('should provide proper screen reader navigation', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      const carousel = screen.getByTestId('testimonials-carousel');
      expect(carousel).toHaveAttribute('aria-label', expect.stringContaining('testimonials'));
      expect(carousel).toHaveAttribute('role', 'region');
      
      // Current testimonial should be announced
      const currentTestimonial = screen.getByTestId('current-testimonial');
      expect(currentTestimonial).toHaveAttribute('aria-live', 'polite');
    });

    it('should provide testimonial navigation status', () => {
      render(<TestimonialsSection content={mockContent} />);
      
      const status = screen.getByTestId('testimonial-status');
      expect(status).toHaveTextContent(/1 of 3/);
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      render(<TestimonialsSection content={mockContent} />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveClass('high-contrast');
    });
  });

  describe('Integration: Loading and Error States', () => {
    it('should handle loading state', () => {
      render(<TestimonialsSection content={mockContent} isLoading={true} />);
      
      const loadingSkeleton = screen.getByTestId('testimonials-loading-skeleton');
      expect(loadingSkeleton).toBeInTheDocument();
    });

    it('should handle empty testimonials gracefully', () => {
      const emptyContent = { ...mockContent, testimonials: [] };
      render(<TestimonialsSection content={emptyContent} />);
      
      const emptyState = screen.getByTestId('no-testimonials-placeholder');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent(/no testimonials available/i);
    });

    it('should handle avatar loading failures', async () => {
      render(<TestimonialsSection content={mockContent} />);
      
      // Simulate image load failure
      const avatarImages = screen.getAllByRole('img');
      fireEvent.error(avatarImages[0]);
      
      await waitFor(() => {
        // Should show fallback avatar
        expect(avatarImages[0]).toHaveAttribute('src', '/avatars/fallback.webp');
      });
    });
  });

  describe('Integration: Analytics and Tracking', () => {
    it('should track testimonial views', () => {
      render(<TestimonialsSection content={mockContent} onTestimonialView={mockOnTestimonialView} />);
      
      // Should track when testimonials come into view
      expect(mockOnTestimonialView).toHaveBeenCalledWith('testimonial-1');
    });

    it('should track carousel interactions', () => {
      const mockOnInteraction = jest.fn();
      render(
        <TestimonialsSection 
          content={mockContent} 
          onTestimonialView={mockOnTestimonialView}
          onInteraction={mockOnInteraction}
        />
      );
      
      const nextButton = screen.getByRole('button', { name: /next testimonial/i });
      fireEvent.click(nextButton);
      
      expect(mockOnInteraction).toHaveBeenCalledWith({
        type: 'carousel_navigation',
        direction: 'next',
        currentTestimonial: 'testimonial-1'
      });
    });
  });
});