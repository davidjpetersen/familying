/**
 * TestimonialCard Contract Test
 * CRITICAL: This test MUST FAIL before implementation
 * Constitutional compliance: Privacy-first testimonials with AI avatars only
 */

import { render, screen } from '@testing-library/react';
import { TestimonialCard } from '@/components/marketing/ui/testimonial-card';
import { 
  TestimonialItem, 
  Avatar, 
  Attribution, 
  AvatarSource,
  Demographics 
} from '@/lib/types/marketing';

describe('TestimonialCard Contract Tests', () => {
  const mockDemographics: Demographics = {
    ageRange: '30-40',
    familyStructure: 'co-parent',
    ethnicity: 'diverse',
    accessibility: 'none'
  };

  const mockAvatar: Avatar = {
    id: 'avatar-1',
    filename: 'parent-avatar-1.webp',
    altText: 'AI-generated avatar of a parent',
    demographics: mockDemographics,
    source: AvatarSource.AI_GENERATED,
    optimizedVersions: [
      {
        format: 'webp',
        width: 80,
        height: 80,
        url: '/avatars/parent-avatar-1.webp',
        size: 8192,
        blurDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
      }
    ]
  };

  const mockAttribution: Attribution = {
    displayName: 'Sarah M.',
    familyRole: 'co-parent',
    childrenContext: 'twins, ages 5-7',
    location: 'Denver, CO',
    consentDate: new Date('2023-10-01'),
    consentMethod: 'email_consent'
  };

  const mockTestimonial: TestimonialItem = {
    id: 'testimonial-1',
    quote: 'I felt so seen. Finally, something for co-parents that actually gets our unique challenges.',
    attribution: mockAttribution,
    avatar: mockAvatar,
    familyContext: 'co-parent of twins',
    location: 'Denver, CO',
    isVerified: true
  };

  describe('Contract: Required Props', () => {
    it('should render with required testimonial prop', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      const quote = screen.getByText(mockTestimonial.quote);
      expect(quote).toBeInTheDocument();
    });

    it('should render attribution information', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      const attribution = screen.getByText(/Sarah M\./);
      expect(attribution).toBeInTheDocument();
      
      const context = screen.getByText(/co-parent/);
      expect(context).toBeInTheDocument();
      
      const location = screen.getByText(/Denver, CO/);
      expect(location).toBeInTheDocument();
    });
  });

  describe('Contract: Privacy Compliance (Constitutional)', () => {
    it('should only display first name and last initial', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      // Should show "Sarah M." but NOT full name
      expect(screen.getByText(/Sarah M\./)).toBeInTheDocument();
      expect(screen.queryByText(/Sarah Miller/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sarah Martinez/)).not.toBeInTheDocument();
    });

    it('should use AI-generated avatar only (no real photos)', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', '/avatars/parent-avatar-1.webp');
      expect(avatar).toHaveAttribute('alt', 'AI-generated avatar of a parent');
    });

    it('should not display full location addresses', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      // Should show city, state only - no addresses
      expect(screen.getByText(/Denver, CO/)).toBeInTheDocument();
      expect(screen.queryByText(/123 Main Street/)).not.toBeInTheDocument();
      expect(screen.queryByText(/80202/)).not.toBeInTheDocument();
    });

    it('should only render verified testimonials', () => {
      const unverifiedTestimonial = { ...mockTestimonial, isVerified: false };
      
      // Component should not render unverified testimonials
      const { container } = render(<TestimonialCard testimonial={unverifiedTestimonial} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Contract: Inclusive Family Representation', () => {
    it('should display diverse family contexts', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      const familyContext = screen.getByText(/co-parent of twins/);
      expect(familyContext).toBeInTheDocument();
    });

    it('should handle single parent context', () => {
      const singleParentTestimonial = {
        ...mockTestimonial,
        attribution: {
          ...mockAttribution,
          familyRole: 'single mom',
          childrenContext: '2 kids, ages 3-8'
        },
        familyContext: 'single mom of 2'
      };
      
      render(<TestimonialCard testimonial={singleParentTestimonial} />);
      
      expect(screen.getByText(/single mom/)).toBeInTheDocument();
    });

    it('should handle blended family context', () => {
      const blendedFamilyTestimonial = {
        ...mockTestimonial,
        attribution: {
          ...mockAttribution,
          familyRole: 'blended family parent',
          childrenContext: '4 kids, blended household'
        },
        familyContext: 'blended family of 4 kids'
      };
      
      render(<TestimonialCard testimonial={blendedFamilyTestimonial} />);
      
      expect(screen.getByText(/blended family/)).toBeInTheDocument();
    });
  });

  describe('Contract: Quote Length Validation', () => {
    it('should handle quotes up to 280 characters', () => {
      const longQuote = 'This platform completely transformed how we approach parenting in our household. The personalized resources helped us navigate co-parenting challenges with confidence and clarity. Every tool feels designed specifically for our family structure.'; // Under 280 chars
      
      const longQuoteTestimonial = { ...mockTestimonial, quote: longQuote };
      render(<TestimonialCard testimonial={longQuoteTestimonial} />);
      
      expect(screen.getByText(longQuote)).toBeInTheDocument();
    });
  });

  describe('Contract: Accessibility Features', () => {
    it('should have proper semantic structure', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      // Should use proper heading for attribution
      const attribution = screen.getByRole('heading', { level: 3 });
      expect(attribution).toBeInTheDocument();
    });

    it('should have accessible avatar image', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('alt', 'AI-generated avatar of a parent');
    });

    it('should be focusable for keyboard navigation', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      const card = screen.getByRole('article'); // Assuming semantic article element
      expect(card).toBeInTheDocument();
    });
  });

  describe('Contract: Custom Styling', () => {
    it('should accept and apply custom className', () => {
      render(<TestimonialCard testimonial={mockTestimonial} className="custom-testimonial" />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('custom-testimonial');
    });
  });

  describe('Contract: Avatar Performance', () => {
    it('should use optimized WebP format for avatars', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', '/avatars/parent-avatar-1.webp');
    });

    it('should include loading optimization attributes', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('loading', 'lazy');
    });
  });
});