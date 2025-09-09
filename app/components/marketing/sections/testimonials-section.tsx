'use client';

import { motion } from 'framer-motion';
import { TestimonialCard } from '../ui/testimonial-card';
import { TestimonialItem } from '@/app/lib/types/marketing';

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
  className?: string;
}

export function TestimonialsSection({ testimonials, className = '' }: TestimonialsSectionProps) {
  return (
    <section className={`w-full py-20 bg-gray-50 ${className}`}>
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
            Families Love Familying.org
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how families around the world are creating stronger bonds and beautiful memories together.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 mb-6">
            Join thousands of families already building stronger connections.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Start Your Family Journey
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
