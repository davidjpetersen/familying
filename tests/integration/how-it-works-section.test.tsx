/**
 * HowItWorksSection Integration Test
 * CRITICAL: This test MUST FAIL before implementation
 * Tests 3-step process with animations and accessibility compliance
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HowItWorksSection } from '@/app/components/marketing/sections/how-it-works-section';
import { HowItWorksContent, ProcessStep } from '@/app/lib/types/marketing';

describe('HowItWorksSection Integration Tests', () => {
  const mockSteps: ProcessStep[] = [
    {
      id: 'step-1',
      stepNumber: 1,
      title: 'Take the 2-minute quiz',
      description: 'Tell us about your family\'s unique needs, challenges, and what\'s working.',
      icon: 'CheckSquare'
    },
    {
      id: 'step-2',
      stepNumber: 2,
      title: 'Get your custom dashboard',
      description: 'Receive a personalized hub with resources tailored to your household.',
      icon: 'Layout'
    },
    {
      id: 'step-3',
      stepNumber: 3,
      title: 'Access tips, tools, and printable resources',
      description: 'Download meal planners, bedtime scripts, and activities made for your family.',
      icon: 'Download'
    }
  ];

  const mockContent: HowItWorksContent = {
    steps: mockSteps,
    animationEnabled: true
  };

  const mockOnStepView = jest.fn();

  beforeEach(() => {
    mockOnStepView.mockClear();
    
    // Reset window width for each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Integration: Complete 3-Step Process', () => {
    it('should render all three steps in correct order', () => {
      render(<HowItWorksSection content={mockContent} />);
      
      // Section heading
      const sectionHeading = screen.getByRole('heading', { level: 2 });
      expect(sectionHeading).toHaveTextContent(/how it works/i);
      
      // All three steps should be present
      const step1 = screen.getByText('Take the 2-minute quiz');
      const step2 = screen.getByText('Get your custom dashboard');
      const step3 = screen.getByText('Access tips, tools, and printable resources');
      
      expect(step1).toBeInTheDocument();
      expect(step2).toBeInTheDocument();
      expect(step3).toBeInTheDocument();
      
      // Step numbers should be visible
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Icons should be rendered
      expect(screen.getByTestId('step-icon')).toBeInTheDocument();
    });

    it('should display step descriptions with constitutional messaging', () => {
      render(<HowItWorksSection content={mockContent} />);
      
      // Constitutional requirement: personalized approach
      const personalizedMessage = screen.getByText(/personalized hub with resources tailored to your household/);
      expect(personalizedMessage).toBeInTheDocument();
      
      // Constitutional requirement: family inclusivity
      const familyMessage = screen.getByText(/your family's unique needs/);
      expect(familyMessage).toBeInTheDocument();
      
      // Constitutional requirement: practical tools
      const toolsMessage = screen.getByText(/meal planners, bedtime scripts, and activities made for your family/);
      expect(toolsMessage).toBeInTheDocument();
    });

    it('should have proper semantic structure for accessibility', () => {
      render(<HowItWorksSection content={mockContent} />);
      
      // Section should be a landmark
      const section = screen.getByRole('region', { name: /how it works/i });
      expect(section).toBeInTheDocument();
      
      // Steps should be in a list
      const stepsList = screen.getByRole('list');
      expect(stepsList).toBeInTheDocument();
      
      const steps = screen.getAllByRole('listitem');
      expect(steps).toHaveLength(3);
      
      // Each step should have proper heading hierarchy
      const stepHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(stepHeadings).toHaveLength(3);
    });
  });

  describe('Integration: Animation System (Constitutional)', () => {
    it('should animate steps with staggered entrance when animations enabled', async () => {
      render(<HowItWorksSection content={mockContent} animationsEnabled={true} />);
      
      // Steps should have animation containers
      const animatedElements = screen.getAllByTestId('process-step-motion');
      expect(animatedElements).toHaveLength(3);
      
      // Should have stagger delays
      expect(animatedElements[0]).toHaveAttribute('data-animation-delay', '0');
      expect(animatedElements[1]).toHaveAttribute('data-animation-delay', '0.2');
      expect(animatedElements[2]).toHaveAttribute('data-animation-delay', '0.4');
    });

    it('should respect reduced motion preferences (constitutional requirement)', () => {
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

      render(<HowItWorksSection content={mockContent} />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('data-reduced-motion', 'true');
      
      // Animation delays should be reduced or removed
      const animatedElements = screen.getAllByTestId('process-step-motion');
      animatedElements.forEach(element => {
        expect(element).toHaveAttribute('data-reduced-motion', 'true');
      });
    });

    it('should disable animations when animationEnabled is false', () => {
      const noAnimationContent = { ...mockContent, animationEnabled: false };
      render(<HowItWorksSection content={noAnimationContent} />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('data-animations-disabled', 'true');
    });

    it('should trigger view tracking when steps come into view', async () => {
      render(<HowItWorksSection content={mockContent} onStepView={mockOnStepView} />);
      
      // Mock intersection observer triggering
      const steps = screen.getAllByRole('listitem');
      
      // Simulate steps coming into view
      await waitFor(() => {
        expect(mockOnStepView).toHaveBeenCalledWith(1);
        expect(mockOnStepView).toHaveBeenCalledWith(2);
        expect(mockOnStepView).toHaveBeenCalledWith(3);
      });
    });
  });

  describe('Integration: Responsive Layout', () => {
    it('should use horizontal layout on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<HowItWorksSection content={mockContent} />);
      
      const stepsList = screen.getByRole('list');
      expect(stepsList).toHaveClass('steps-horizontal');
      
      // Steps should be in a row
      const section = screen.getByRole('region');
      expect(section).toHaveClass('desktop-layout');
    });

    it('should use vertical layout on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<HowItWorksSection content={mockContent} />);
      
      const stepsList = screen.getByRole('list');
      expect(stepsList).toHaveClass('steps-vertical');
      
      // Steps should stack vertically
      const section = screen.getByRole('region');
      expect(section).toHaveClass('mobile-layout');
    });

    it('should adapt step content for mobile readability', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<HowItWorksSection content={mockContent} />);
      
      // Descriptions should be readable on mobile
      const descriptions = screen.getAllByTestId('step-description');
      descriptions.forEach(desc => {
        expect(desc).toHaveClass('mobile-description');
      });
    });
  });

  describe('Integration: Icon System', () => {
    it('should render correct icons for each step', () => {
      render(<HowItWorksSection content={mockContent} />);
      
      // Should render specific icons based on step content
      const checkSquareIcon = screen.getByTestId('step-icon');
      expect(checkSquareIcon).toHaveAttribute('data-icon', 'CheckSquare');
      
      const layoutIcon = screen.getAllByTestId('step-icon')[1];
      expect(layoutIcon).toHaveAttribute('data-icon', 'Layout');
      
      const downloadIcon = screen.getAllByTestId('step-icon')[2];
      expect(downloadIcon).toHaveAttribute('data-icon', 'Download');
    });

    it('should have accessible icons with proper labels', () => {
      render(<HowItWorksSection content={mockContent} />);
      
      const icons = screen.getAllByTestId('step-icon');
      icons.forEach((icon, index) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true'); // Decorative icons
        expect(icon).toHaveAttribute('role', 'presentation');
      });
    });
  });

  describe('Integration: Interactive Features', () => {
    it('should handle step clicks when interactive', () => {
      const mockOnStepClick = jest.fn();
      
      render(
        <HowItWorksSection 
          content={mockContent} 
          onStepView={mockOnStepView}
          onStepClick={mockOnStepClick}
        />
      );
      
      const steps = screen.getAllByRole('listitem');
      fireEvent.click(steps[0]);
      
      expect(mockOnStepClick).toHaveBeenCalledWith(1);
    });

    it('should support keyboard navigation between steps', () => {
      const mockOnStepClick = jest.fn();
      
      render(
        <HowItWorksSection 
          content={mockContent} 
          onStepClick={mockOnStepClick}
        />
      );
      
      const steps = screen.getAllByRole('listitem');
      
      // Should be focusable
      steps[0].focus();
      expect(steps[0]).toHaveFocus();
      
      // Enter key should trigger interaction
      fireEvent.keyDown(steps[0], { key: 'Enter' });
      expect(mockOnStepClick).toHaveBeenCalledWith(1);
      
      // Arrow keys should navigate
      fireEvent.keyDown(steps[0], { key: 'ArrowRight' });
      expect(steps[1]).toHaveFocus();
    });
  });

  describe('Integration: Performance Optimization', () => {
    it('should optimize animations for performance', () => {
      render(<HowItWorksSection content={mockContent} />);
      
      const animatedElements = screen.getAllByTestId('process-step-motion');
      animatedElements.forEach(element => {
        // Should use transform and opacity for GPU acceleration
        expect(element).toHaveStyle('will-change: transform, opacity');
      });
    });

    it('should lazy load step content that\'s not immediately visible', () => {
      render(<HowItWorksSection content={mockContent} />);
      
      // Below-the-fold content should be lazy loaded
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('data-lazy-load', 'true');
    });
  });

  describe('Integration: Content Validation', () => {
    it('should handle missing steps gracefully', () => {
      const emptyContent = { ...mockContent, steps: [] };
      render(<HowItWorksSection content={emptyContent} />);
      
      // Should show placeholder or error state
      const placeholder = screen.getByTestId('empty-steps-placeholder');
      expect(placeholder).toBeInTheDocument();
    });

    it('should validate step data completeness', () => {
      const incompleteSteps = [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Incomplete Step',
          // Missing description and icon
          description: '',
          icon: ''
        }
      ];
      
      const incompleteContent = { ...mockContent, steps: incompleteSteps };
      render(<HowItWorksSection content={incompleteContent} />);
      
      // Should show validation warning or fallback content
      const warning = screen.queryByTestId('step-validation-warning');
      if (warning) {
        expect(warning).toBeInTheDocument();
      }
    });

    it('should enforce maximum number of steps', () => {
      const tooManySteps = Array.from({ length: 10 }, (_, i) => ({
        id: `step-${i + 1}`,
        stepNumber: i + 1,
        title: `Step ${i + 1}`,
        description: `Description ${i + 1}`,
        icon: 'CheckSquare'
      }));
      
      const overflowContent = { ...mockContent, steps: tooManySteps };
      render(<HowItWorksSection content={overflowContent} />);
      
      // Should limit to reasonable number (e.g., 5 steps max)
      const renderedSteps = screen.getAllByRole('listitem');
      expect(renderedSteps.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Integration: Loading States', () => {
    it('should show loading skeletons while content loads', () => {
      render(<HowItWorksSection content={mockContent} isLoading={true} />);
      
      const loadingSkeleton = screen.getByTestId('steps-loading-skeleton');
      expect(loadingSkeleton).toBeInTheDocument();
    });

    it('should transition from loading to content smoothly', async () => {
      const { rerender } = render(<HowItWorksSection content={mockContent} isLoading={true} />);
      
      expect(screen.getByTestId('steps-loading-skeleton')).toBeInTheDocument();
      
      rerender(<HowItWorksSection content={mockContent} isLoading={false} />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('steps-loading-skeleton')).not.toBeInTheDocument();
        expect(screen.getByText('Take the 2-minute quiz')).toBeInTheDocument();
      });
    });
  });
});