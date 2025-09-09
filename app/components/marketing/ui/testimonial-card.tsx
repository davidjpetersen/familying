/**
 * TestimonialCard Component
 * Constitutional compliance: Privacy-first, diverse representation
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { Avatar } from './avatar';
import type { TestimonialCardProps } from '../../../lib/types/marketing';

export function TestimonialCard({ testimonial, className }: TestimonialCardProps) {
  return (
    <motion.article
      className={cn(
        'bg-white p-6 rounded-lg shadow-sm border border-gray-100',
        'hover:shadow-md transition-shadow duration-200',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Quote */}
      <blockquote className="mb-4">
        <p className="text-gray-700 leading-relaxed italic">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </blockquote>
      
      {/* Attribution */}
      <footer className="flex items-start gap-3">
        <Avatar 
          avatar={testimonial.avatar} 
          size="md"
          className="flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <cite className="font-medium text-gray-900 not-italic">
              {testimonial.attribution.displayName}
            </cite>
            {testimonial.isVerified && (
              <span 
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                aria-label="Verified family"
              >
                ✓ Verified
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>{testimonial.attribution.familyRole}</p>
            <p>{testimonial.familyContext}</p>
            <p>{testimonial.location}</p>
          </div>
        </div>
      </footer>
      
      {/* Screen reader context */}
      <div className="sr-only">
        Testimonial from {testimonial.attribution.displayName}, 
        a {testimonial.attribution.familyRole} with {testimonial.attribution.childrenContext} 
        from {testimonial.location}.
        {testimonial.isVerified && ' This family is verified.'}
      </div>
    </motion.article>
  );
}
