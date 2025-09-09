/**
 * CTAButton Contract Test
 * CRITICAL: This test MUST FAIL before implementation
 * Constitutional compliance: TDD with RED-GREEN-Refactor cycle
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CTAButton } from '@/app/components/marketing/ui/cta-button';
import { CTAButton as CTAButtonType, ButtonVariant, ButtonSize } from '@/app/lib/types/marketing';

describe('CTAButton Contract Tests', () => {
  const mockButton: CTAButtonType = {
    id: 'test-cta',
    text: 'Start My Quiz',
    href: '/quiz',
    variant: ButtonVariant.PRIMARY,
    size: ButtonSize.LG,
    ariaLabel: 'Start your personalized parenting quiz',
    trackingEvent: 'cta_test_click',
    isDisabled: false,
    isExternal: false
  };

  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Contract: Required Props', () => {
    it('should render with required button prop', () => {
      render(<CTAButton button={mockButton} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Start My Quiz');
    });

    it('should render as link when href is provided', () => {
      render(<CTAButton button={mockButton} />);
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/quiz');
    });
  });

  describe('Contract: Accessibility Compliance', () => {
    it('should have proper ARIA label', () => {
      render(<CTAButton button={mockButton} />);
      
      const element = screen.getByLabelText('Start your personalized parenting quiz');
      expect(element).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<CTAButton button={mockButton} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledWith(
        expect.any(Object),
        'cta_test_click'
      );
    });

    it('should support disabled state', () => {
      const disabledButton = { ...mockButton, isDisabled: true };
      render(<CTAButton button={disabledButton} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Contract: Visual Variants', () => {
    it('should apply PRIMARY variant styling', () => {
      render(<CTAButton button={mockButton} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary'); // Expected class name
    });

    it('should apply SECONDARY variant styling', () => {
      const secondaryButton = { ...mockButton, variant: ButtonVariant.SECONDARY };
      render(<CTAButton button={secondaryButton} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary');
    });

    it('should apply OUTLINE variant styling', () => {
      const outlineButton = { ...mockButton, variant: ButtonVariant.OUTLINE };
      render(<CTAButton button={outlineButton} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-outline');
    });
  });

  describe('Contract: Size Variants', () => {
    it('should apply LARGE size styling', () => {
      render(<CTAButton button={mockButton} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-lg');
    });

    it('should apply MEDIUM size styling', () => {
      const mediumButton = { ...mockButton, size: ButtonSize.MD };
      render(<CTAButton button={mediumButton} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-md');
    });

    it('should apply SMALL size styling', () => {
      const smallButton = { ...mockButton, size: ButtonSize.SM };
      render(<CTAButton button={smallButton} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-sm');
    });
  });

  describe('Contract: Click Handling', () => {
    it('should call onClick with event and tracking data', () => {
      render(<CTAButton button={mockButton} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledWith(
        expect.any(Object),
        'cta_test_click'
      );
    });

    it('should not call onClick when disabled', () => {
      const disabledButton = { ...mockButton, isDisabled: true };
      render(<CTAButton button={disabledButton} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Contract: External Links', () => {
    it('should handle external links with proper attributes', () => {
      const externalButton = { 
        ...mockButton, 
        href: 'https://external-site.com',
        isExternal: true 
      };
      render(<CTAButton button={externalButton} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Contract: Custom Styling', () => {
    it('should accept and apply custom className', () => {
      render(<CTAButton button={mockButton} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Contract: Text Length Validation', () => {
    it('should handle text up to 30 characters (constitutional limit)', () => {
      const longTextButton = { 
        ...mockButton, 
        text: 'Start My Quiz Today and Begin' // 30 chars
      };
      render(<CTAButton button={longTextButton} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Start My Quiz Today and Begin');
    });
  });
});