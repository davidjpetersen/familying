/**
 * ResourceCard Component
 * Constitutional compliance: Clear value proposition, accessible design
 */

'use client';

import { motion } from 'framer-motion';
import { Download, Lock } from 'lucide-react';
import Image from 'next/image';
import { cn } from '../../../../lib/utils';
import type { ResourceCardProps } from '../../../lib/types/marketing';

export function ResourceCard({ resource, onDownload, className }: ResourceCardProps) {
  const handleDownload = () => {
    if (onDownload && !resource.isPremium) {
      onDownload(resource.id);
    }
  };

  const formatFileSize = (sizeInBytes?: number) => {
    if (!sizeInBytes) return '';
    
    const mb = sizeInBytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    
    const kb = sizeInBytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  return (
    <motion.article
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden',
        'hover:shadow-md transition-shadow duration-200',
        'focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] relative bg-gray-100">
        <Image
          src={resource.thumbnailImage}
          alt={`Preview of ${resource.title} resource`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Premium badge */}
        {resource.isPremium && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              <Lock className="w-3 h-3" />
              Premium
            </span>
          </div>
        )}
        
        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white bg-opacity-90 text-gray-700 rounded-full">
            {resource.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {resource.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {resource.description}
        </p>
        
        {/* File info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span className="uppercase tracking-wide">
            {resource.fileFormat}
          </span>
          {resource.fileSize && (
            <span>
              {formatFileSize(resource.fileSize)}
            </span>
          )}
        </div>
        
        {/* Download button */}
        {resource.downloadUrl && !resource.isPremium && (
          <button
            onClick={handleDownload}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2',
              'bg-purple-600 hover:bg-purple-700 text-white',
              'rounded-md text-sm font-medium transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
            )}
            aria-label={`Download ${resource.title}`}
          >
            <Download className="w-4 h-4" />
            Download Free
          </button>
        )}
        
        {/* Premium call-to-action */}
        {resource.isPremium && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Available with Premium
            </p>
            <button
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2',
                'bg-yellow-100 hover:bg-yellow-200 text-yellow-800',
                'rounded-md text-sm font-medium transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'
              )}
              aria-label={`Upgrade to access ${resource.title}`}
            >
              <Lock className="w-4 h-4" />
              Upgrade to Download
            </button>
          </div>
        )}
      </div>
      
      {/* Screen reader context */}
      <div className="sr-only">
        Resource: {resource.title}. 
        Category: {resource.category.replace(/-/g, ' ')}. 
        Format: {resource.fileFormat}.
        {resource.fileSize && ` Size: ${formatFileSize(resource.fileSize)}.`}
        {resource.isPremium ? ' Premium access required.' : ' Free download available.'}
      </div>
    </motion.article>
  );
}
