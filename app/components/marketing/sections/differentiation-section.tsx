'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface ComparisonFeature {
  feature: string;
  familying: boolean;
  others: boolean;
  highlight?: boolean;
}

interface DifferentiationSectionProps {
  className?: string;
}

const comparisonFeatures: ComparisonFeature[] = [
  { feature: 'Privacy-first approach', familying: true, others: false, highlight: true },
  { feature: 'No email required for free resources', familying: true, others: false, highlight: true },
  { feature: 'Research-backed activities', familying: true, others: true },
  { feature: 'Age-appropriate content', familying: true, others: true },
  { feature: 'Screen-free activity focus', familying: true, others: false, highlight: true },
  { feature: 'Transparent pricing', familying: true, others: false },
  { feature: 'Data not sold to third parties', familying: true, others: false, highlight: true },
  { feature: 'Accessible design (WCAG 2.2 AA)', familying: true, others: false },
  { feature: 'Mobile-optimized', familying: true, others: true },
  { feature: 'Community features', familying: false, others: true },
  { feature: 'Social media integration', familying: false, others: true },
  { feature: 'Data tracking', familying: false, others: true },
];

export function DifferentiationSection({ className = '' }: DifferentiationSectionProps) {
  return (
    <section className={`w-full py-20 bg-gray-50 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Familying.org?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We believe families deserve privacy, simplicity, and quality. Here&rsquo;s how we&rsquo;re different from other family activity platforms.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">Features</h3>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-purple-600">Familying.org</h3>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-600">Other Platforms</h3>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {comparisonFeatures.map((item, index) => (
              <motion.div
                key={item.feature}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`px-6 py-4 grid grid-cols-3 gap-4 items-center ${
                  item.highlight ? 'bg-purple-25 border-l-4 border-purple-500' : ''
                }`}
              >
                <div className="text-left">
                  <span className={`text-sm ${item.highlight ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {item.feature}
                  </span>
                </div>
                <div className="text-center">
                  {item.familying ? (
                    <Check className="w-6 h-6 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-6 h-6 text-gray-300 mx-auto" />
                  )}
                </div>
                <div className="text-center">
                  {item.others ? (
                    <Check className="w-6 h-6 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-6 h-6 text-gray-300 mx-auto" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-lg text-gray-600 mb-6">
            Ready to experience the difference? Start with our free resources.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Get Started for Free
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
