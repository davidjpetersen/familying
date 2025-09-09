'use client';

import { motion } from 'framer-motion';
import { ResourceCard } from '../ui/resource-card';
import { CTAButton } from '../ui/cta-button';
import { ResourcePreview, ButtonVariant, ButtonSize } from '@/app/lib/types/marketing';

interface FreePreviewSectionProps {
  resources: ResourcePreview[];
  className?: string;
}

export function FreePreviewSection({ resources, className = '' }: FreePreviewSectionProps) {
  // Show only first 3 resources as preview
  const previewResources = resources.slice(0, 3);

  return (
    <section className={`w-full py-20 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get Started with Free Resources
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Download these beautiful, research-backed activities to start building stronger family connections today.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-green-800 font-medium">
              ✨ No email required • Instant download • Privacy-first approach
            </p>
          </div>
        </motion.div>

        {/* Resources Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {previewResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <ResourceCard resource={resource} />
            </motion.div>
          ))}
        </motion.div>

        {/* Show More Resources Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center bg-gray-50 rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Want Access to 50+ Premium Resources?
          </h3>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Join our premium collection and get exclusive access to seasonal activities, 
            age-specific guides, and advanced relationship-building tools.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <CTAButton 
              button={{
                id: 'explore-premium',
                text: 'Explore Premium Resources',
                href: '/subscription',
                variant: ButtonVariant.PRIMARY,
                size: ButtonSize.LG,
                ariaLabel: 'Explore premium family activity resources',
                isExternal: false,
                isDisabled: false,
                trackingEvent: 'explore_premium_click'
              }}
              className="w-full sm:w-auto"
            />
            <CTAButton 
              button={{
                id: 'continue-free',
                text: 'Continue with Free Resources',
                href: '/recipes',
                variant: ButtonVariant.SECONDARY,
                size: ButtonSize.LG,
                ariaLabel: 'Continue with free family activity resources',
                isExternal: false,
                isDisabled: false,
                trackingEvent: 'continue_free_click'
              }}
              className="w-full sm:w-auto"
            />
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Premium starts at $9/month • Cancel anytime • 30-day money-back guarantee
          </p>
        </motion.div>
      </div>
    </section>
  );
}
