/**
 * ResourceCard Contract Test  
 * CRITICAL: This test MUST FAIL before implementation
 * Constitutional compliance: Privacy-safe resource previews with download functionality
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ResourceCard } from '@/components/marketing/ui/resource-card';
import { ResourcePreview, ResourceCategory } from '@/lib/types/marketing';

describe('ResourceCard Contract Tests', () => {
  const mockResource: ResourcePreview = {
    id: 'resource-1',
    title: 'Weekly Meal Planner',
    description: 'Customizable meal planning template designed for busy families with dietary preferences and prep time.',
    category: ResourceCategory.MEAL_PLANNING,
    thumbnailImage: '/images/resources/meal-planner-thumb.jpg',
    downloadUrl: '/downloads/meal-planner.pdf',
    isPremium: false,
    fileFormat: 'PDF',
    fileSize: 2048000 // 2MB
  };

  const mockPremiumResource: ResourcePreview = {
    ...mockResource,
    id: 'premium-resource-1',
    title: 'Advanced Bedtime Script',
    description: 'Detailed bedtime routine scripts for different age groups with calming techniques.',
    category: ResourceCategory.BEDTIME_ROUTINES,
    isPremium: true,
    downloadUrl: undefined // Premium resources may not have direct downloads
  };

  const mockOnDownload = jest.fn();

  beforeEach(() => {
    mockOnDownload.mockClear();
  });

  describe('Contract: Required Props', () => {
    it('should render with required resource prop', () => {
      render(<ResourceCard resource={mockResource} />);
      
      const title = screen.getByText('Weekly Meal Planner');
      expect(title).toBeInTheDocument();
      
      const description = screen.getByText(/Customizable meal planning template/);
      expect(description).toBeInTheDocument();
    });

    it('should display resource thumbnail', () => {
      render(<ResourceCard resource={mockResource} />);
      
      const thumbnail = screen.getByRole('img');
      expect(thumbnail).toHaveAttribute('src', '/images/resources/meal-planner-thumb.jpg');
      expect(thumbnail).toHaveAttribute('alt', expect.stringContaining('Weekly Meal Planner'));
    });
  });

  describe('Contract: Title Length Validation', () => {
    it('should handle titles up to 50 characters (constitutional limit)', () => {
      const longTitleResource = {
        ...mockResource,
        title: 'Super Comprehensive Weekly Family Meal Planning Kit' // 49 chars
      };
      render(<ResourceCard resource={longTitleResource} />);
      
      expect(screen.getByText('Super Comprehensive Weekly Family Meal Planning Kit')).toBeInTheDocument();
    });
  });

  describe('Contract: Description Length Validation', () => {
    it('should handle descriptions up to 120 characters (constitutional limit)', () => {
      const longDescResource = {
        ...mockResource,
        description: 'Detailed customizable meal planning template designed specifically for busy modern families with picky eaters' // 119 chars
      };
      render(<ResourceCard resource={longDescResource} />);
      
      expect(screen.getByText(/Detailed customizable meal planning template/)).toBeInTheDocument();
    });
  });

  describe('Contract: Resource Categories', () => {
    it('should display meal planning category', () => {
      render(<ResourceCard resource={mockResource} />);
      
      const category = screen.getByText(/meal.planning/i);
      expect(category).toBeInTheDocument();
    });

    it('should display bedtime routines category', () => {
      const bedtimeResource = {
        ...mockResource,
        category: ResourceCategory.BEDTIME_ROUTINES
      };
      render(<ResourceCard resource={bedtimeResource} />);
      
      const category = screen.getByText(/bedtime.routines/i);
      expect(category).toBeInTheDocument();
    });

    it('should display activity guides category', () => {
      const activityResource = {
        ...mockResource,
        category: ResourceCategory.ACTIVITY_GUIDES
      };
      render(<ResourceCard resource={activityResource} />);
      
      const category = screen.getByText(/activity.guides/i);
      expect(category).toBeInTheDocument();
    });
  });

  describe('Contract: Download Functionality', () => {
    it('should show download button for free resources with downloadUrl', () => {
      render(<ResourceCard resource={mockResource} onDownload={mockOnDownload} />);
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
    });

    it('should call onDownload when download button clicked', () => {
      render(<ResourceCard resource={mockResource} onDownload={mockOnDownload} />);
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);
      
      expect(mockOnDownload).toHaveBeenCalledWith('resource-1');
    });

    it('should not show download button when onDownload not provided', () => {
      render(<ResourceCard resource={mockResource} />);
      
      const downloadButton = screen.queryByRole('button', { name: /download/i });
      expect(downloadButton).not.toBeInTheDocument();
    });
  });

  describe('Contract: Premium Resource Handling', () => {
    it('should show premium badge for premium resources', () => {
      render(<ResourceCard resource={mockPremiumResource} />);
      
      const premiumBadge = screen.getByText(/premium/i);
      expect(premiumBadge).toBeInTheDocument();
    });

    it('should show different CTA for premium resources', () => {
      render(<ResourceCard resource={mockPremiumResource} />);
      
      const premiumCTA = screen.getByText(/unlock/i);
      expect(premiumCTA).toBeInTheDocument();
    });

    it('should not show direct download for premium resources without URLs', () => {
      render(<ResourceCard resource={mockPremiumResource} onDownload={mockOnDownload} />);
      
      const downloadButton = screen.queryByRole('button', { name: /download/i });
      expect(downloadButton).not.toBeInTheDocument();
    });
  });

  describe('Contract: File Information', () => {
    it('should display file format', () => {
      render(<ResourceCard resource={mockResource} />);
      
      const fileFormat = screen.getByText(/PDF/);
      expect(fileFormat).toBeInTheDocument();
    });

    it('should display file size when provided', () => {
      render(<ResourceCard resource={mockResource} />);
      
      // Should show human-readable file size (2MB)
      const fileSize = screen.getByText(/2(\.|,)?\d*\s*MB/);
      expect(fileSize).toBeInTheDocument();
    });

    it('should handle resources without file size', () => {
      const noSizeResource = { ...mockResource, fileSize: undefined };
      render(<ResourceCard resource={noSizeResource} />);
      
      // Should still render without file size
      const title = screen.getByText('Weekly Meal Planner');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Contract: Accessibility Features', () => {
    it('should have proper heading structure', () => {
      render(<ResourceCard resource={mockResource} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Weekly Meal Planner');
    });

    it('should have accessible thumbnail image', () => {
      render(<ResourceCard resource={mockResource} />);
      
      const thumbnail = screen.getByRole('img');
      expect(thumbnail).toHaveAttribute('alt');
      expect(thumbnail.getAttribute('alt')).not.toBe('');
    });

    it('should be keyboard navigable', () => {
      render(<ResourceCard resource={mockResource} onDownload={mockOnDownload} />);
      
      const downloadButton = screen.getByRole('button');
      downloadButton.focus();
      expect(downloadButton).toHaveFocus();
      
      fireEvent.keyDown(downloadButton, { key: 'Enter' });
      expect(mockOnDownload).toHaveBeenCalledWith('resource-1');
    });
  });

  describe('Contract: Performance Optimization', () => {
    it('should use lazy loading for thumbnail images', () => {
      render(<ResourceCard resource={mockResource} />);
      
      const thumbnail = screen.getByRole('img');
      expect(thumbnail).toHaveAttribute('loading', 'lazy');
    });

    it('should have optimized image attributes', () => {
      render(<ResourceCard resource={mockResource} />);
      
      const thumbnail = screen.getByRole('img');
      expect(thumbnail).toHaveAttribute('width');
      expect(thumbnail).toHaveAttribute('height');
    });
  });

  describe('Contract: Custom Styling', () => {
    it('should accept and apply custom className', () => {
      render(<ResourceCard resource={mockResource} className="custom-resource-card" />);
      
      const card = screen.getByRole('article'); // Assuming semantic article element
      expect(card).toHaveClass('custom-resource-card');
    });
  });

  describe('Contract: Security Validation', () => {
    it('should validate download URLs for security', () => {
      const suspiciousResource = {
        ...mockResource,
        downloadUrl: 'javascript:alert("xss")'
      };
      
      render(<ResourceCard resource={suspiciousResource} onDownload={mockOnDownload} />);
      
      // Should not render download button for suspicious URLs
      const downloadButton = screen.queryByRole('button', { name: /download/i });
      expect(downloadButton).not.toBeInTheDocument();
    });

    it('should sanitize thumbnail image sources', () => {
      const suspiciousResource = {
        ...mockResource,
        thumbnailImage: 'javascript:alert("xss")'
      };
      
      render(<ResourceCard resource={suspiciousResource} />);
      
      const thumbnail = screen.getByRole('img');
      expect(thumbnail).toHaveAttribute('src', '/images/fallback-thumbnail.jpg'); // Should fallback to safe image
    });
  });
});