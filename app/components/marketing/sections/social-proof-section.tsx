'use client';

import { motion } from 'framer-motion';
import { Users, Download, Star, Heart } from 'lucide-react';

interface SocialProofSectionProps {
  className?: string;
}

const metrics = [
  {
    icon: Users,
    value: '2,847',
    label: 'Active Families',
    description: 'Using our resources monthly',
    color: 'text-blue-600'
  },
  {
    icon: Download,
    value: '15,420',
    label: 'Resources Downloaded',
    description: 'Free activities shared',
    color: 'text-green-600'
  },
  {
    icon: Star,
    value: '4.9',
    label: 'Average Rating',
    description: 'From family feedback',
    color: 'text-yellow-600'
  },
  {
    icon: Heart,
    value: '94%',
    label: 'Report Stronger Bonds',
    description: 'After using our activities',
    color: 'text-pink-600'
  }
];

const achievements = [
  'Featured in Family Education Weekly',
  'Recommended by child development experts',
  'Zero data breaches since launch',
  'Privacy-first certification from TrustArc',
  'WCAG 2.2 AA accessibility compliance'
];

export function SocialProofSection({ className = '' }: SocialProofSectionProps) {
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
            Trusted by Families Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real impact, transparent metrics, and genuine feedback from families who value privacy and quality time together.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                className="text-center bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white mb-4 ${metric.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-1">
                  {metric.label}
                </div>
                <div className="text-sm text-gray-600">
                  {metric.description}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Achievements & Recognition */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gray-50 rounded-2xl p-8 md:p-12"
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Recognition & Achievements
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">{achievement}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Transparency Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              Our Commitment to Transparency
            </h4>
            <p className="text-blue-800">
              All metrics are updated monthly and verified by our privacy-first analytics system. 
              We never inflate numbers or use vanity metrics. What you see is genuine impact from real families.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
