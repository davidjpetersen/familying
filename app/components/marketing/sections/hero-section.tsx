/**
 * HeroSection Component
 * Constitutional compliance: Clear value proposition, accessible design
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '../../../../lib/utils';
import { CTAButton } from '../ui/cta-button';
import type { HeroSectionProps } from '../../../lib/types/marketing';

export function HeroSection({ content, className }: HeroSectionProps) {
  return (
    <section 
      className={cn(
        'bg-gradient-to-br from-purple-50 via-white to-blue-50 w-full pt-0 pb-20',
        className
      )}
      aria-labelledby="hero-heading"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
            >
              {content.headline}
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              {content.subheadline}
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <CTAButton button={content.primaryCta} />
              
              {content.secondaryCta && (
                <CTAButton button={content.secondaryCta} />
              )}
            </div>
          </motion.div>
          
          {/* Hero Image */}
          {content.heroImage && (
            <motion.div
              className="relative mx-auto max-w-md lg:max-w-none"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative bg-white rounded-2xl shadow-2xl p-4">
                <Image
                  src={content.heroImage.src}
                  alt={content.heroImage.alt}
                  width={content.heroImage.width}
                  height={content.heroImage.height}
                  className="w-full h-auto rounded-lg"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-500 rounded-full animate-pulse delay-1000"></div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
