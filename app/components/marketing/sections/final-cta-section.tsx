'use client';

import { motion } from 'framer-motion';
import { CTAButton } from '../ui/cta-button';
import { Heart, Shield, Clock } from 'lucide-react';
import { ButtonVariant, ButtonSize } from '@/lib/types/marketing';

interface FinalCtaSectionProps {
  className?: string;
}

const benefits = [
  {
    icon: Heart,
    title: 'Stronger Family Bonds',
    description: 'Research-backed activities that bring families closer together'
  },
  {
    icon: Shield,
    title: 'Privacy Protected',
    description: 'Your family\'s data stays private - no tracking, no ads, no selling'
  },
  {
    icon: Clock,
    title: 'Start Today',
    description: 'Download free resources instantly, no email required'
  }
];

export function FinalCtaSection({ className = '' }: FinalCtaSectionProps) {
  return (
    <section className={`w-full py-20 bg-gradient-to-br from-purple-600 to-pink-600 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Family Time?
          </h2>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto mb-8">
            Join thousands of families who have discovered the joy of meaningful, screen-free activities. 
            Start your journey today with our free, privacy-first resources.
          </p>
          
          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <CTAButton 
              button={{
                id: 'final-get-started',
                text: 'Get Free Resources Now',
                href: '/recipes',
                variant: ButtonVariant.SECONDARY,
                size: ButtonSize.LG,
                ariaLabel: 'Get free family activity resources',
                isExternal: false,
                isDisabled: false,
                trackingEvent: 'final_cta_free_resources'
              }}
              className="bg-white text-purple-600 hover:bg-gray-50 border-2 border-white font-bold text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            />
            <CTAButton 
              button={{
                id: 'final-premium',
                text: 'Explore Premium',
                href: '/subscription',
                variant: ButtonVariant.OUTLINE,
                size: ButtonSize.LG,
                ariaLabel: 'Explore premium family activity resources',
                isExternal: false,
                isDisabled: false,
                trackingEvent: 'final_cta_premium'
              }}
              className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-purple-600 font-bold text-lg px-10 py-4 rounded-xl transition-all duration-200"
            />
          </div>
          
          <p className="text-purple-200 text-sm">
            ✨ No email required for free resources • Privacy-first approach • Cancel premium anytime
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.5 + (index * 0.1),
                  ease: "easeOut"
                }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-purple-100">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-16 pt-8 border-t border-white/20"
        >
          <p className="text-purple-200 mb-4">
            Trusted by 2,800+ families • Privacy-first certified • WCAG 2.2 AA accessible
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-purple-300">
            <span>📊 Transparent metrics</span>
            <span>🔒 Zero data breaches</span>
            <span>⭐ 4.9/5 family rating</span>
            <span>🏆 Expert recommended</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
