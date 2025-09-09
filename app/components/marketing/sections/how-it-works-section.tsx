/**
 * HowItWorksSection Component  
 * Constitutional compliance: Clear process explanation, accessible animations
 */

'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '../../../../lib/utils';
import { ProcessStep } from '../ui/process-step';
import type { HowItWorksSectionProps } from '../../../lib/types/marketing';

export function HowItWorksSection({ content, className }: HowItWorksSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section 
      ref={ref}
      className={cn(
        'w-full py-20 bg-white',
        className
      )}
      aria-labelledby="how-it-works-heading"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get personalized family strategies in three simple steps.
          </p>
        </motion.div>
        
        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {content.steps.map((step, index) => (
            <ProcessStep
              key={step.id}
              step={step}
              isInView={isInView}
              delay={index * 0.2}
              className="relative"
            />
          ))}
        </div>
        
        {/* Connection Lines (Desktop) */}
        <div className="hidden md:block relative mt-8">
          <div className="absolute top-0 left-1/6 right-1/6 h-1 bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200"></div>
        </div>
      </div>
    </section>
  );
}
