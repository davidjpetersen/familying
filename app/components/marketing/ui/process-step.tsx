/**
 * ProcessStep Component with Framer Motion
 * Constitutional compliance: Clear communication, accessible animations
 */

'use client';

import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Lightbulb, 
  Heart,
  CheckCircle,
  ArrowRight 
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { ProcessStepProps } from '../../../lib/types/marketing';

// Icon mapping for process steps
const iconMap = {
  'clipboard-list': ClipboardList,
  'lightbulb': Lightbulb,
  'heart': Heart,
  'check-circle': CheckCircle,
  'arrow-right': ArrowRight
};

export function ProcessStep({ 
  step, 
  isInView = false, 
  delay = 0, 
  className 
}: ProcessStepProps) {
  const IconComponent = iconMap[step.icon as keyof typeof iconMap] || CheckCircle;
  
  return (
    <motion.article
      className={cn(
        'relative flex flex-col items-center text-center',
        'p-6 bg-white rounded-lg shadow-sm border border-gray-100',
        className
      )}
      initial={{ 
        opacity: 0, 
        y: 30,
        scale: 0.95 
      }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0,
        scale: 1
      } : {}}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: [0.4, 0, 0.2, 1],
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
    >
      {/* Step number badge */}
      <motion.div
        className="absolute -top-3 -left-3 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
        initial={{ scale: 0, rotate: -180 }}
        animate={isInView ? { scale: 1, rotate: 0 } : {}}
        transition={{
          duration: 0.5,
          delay: delay + 0.2,
          type: 'spring',
          stiffness: 200,
          damping: 10
        }}
      >
        {step.stepNumber}
      </motion.div>
      
      {/* Icon */}
      <motion.div
        className="mb-4 p-4 bg-purple-50 rounded-full"
        initial={{ scale: 0, rotate: -90 }}
        animate={isInView ? { scale: 1, rotate: 0 } : {}}
        transition={{
          duration: 0.4,
          delay: delay + 0.1,
          type: 'spring',
          stiffness: 150,
          damping: 12
        }}
      >
        <IconComponent 
          className="w-8 h-8 text-purple-600" 
          aria-hidden="true"
        />
      </motion.div>
      
      {/* Title */}
      <motion.h3
        className="text-lg font-semibold text-gray-900 mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: 0.4,
          delay: delay + 0.3
        }}
      >
        {step.title}
      </motion.h3>
      
      {/* Description */}
      <motion.p
        className="text-gray-600 leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: 0.4,
          delay: delay + 0.4
        }}
      >
        {step.description}
      </motion.p>
      
      {/* Subtle animation indicator */}
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-purple-200 opacity-0"
        animate={{
          opacity: [0, 0.5, 0],
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 2,
          delay: delay + 1,
          repeat: Infinity,
          repeatDelay: 3
        }}
      />
      
      {/* Screen reader enhancements */}
      <div className="sr-only">
        Step {step.stepNumber} of the process: {step.title}. 
        {step.description}
      </div>
    </motion.article>
  );
}
