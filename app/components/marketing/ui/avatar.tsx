/**
 * Avatar Component with AI-generated image support
 * Constitutional compliance: Privacy-first, diverse representation
 */

'use client';

import Image from 'next/image';
import { cn } from '../../../../lib/utils';
import type { AvatarProps } from '../../../lib/types/marketing';

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16'
};

export function Avatar({ avatar, size = 'md', className }: AvatarProps) {
  const sizeClasses = avatarSizes[size];
  
  // Find the best image variant for the size
  const getOptimalImageVariant = () => {
    if (avatar.optimizedVersions.length === 0) {
      // Fallback to a default image if no variants exist
      return {
        format: 'jpeg' as const,
        width: 100,
        height: 100,
        url: `/avatars/default-${avatar.id}.jpg`,
        size: 5000
      };
    }

    const targetSize = size === 'sm' ? 32 : size === 'md' ? 48 : 64;
    
    // Sort by how close the width is to our target size
    const sortedVariants = avatar.optimizedVersions.sort((a, b) => {
      const aDiff = Math.abs(a.width - targetSize);
      const bDiff = Math.abs(b.width - targetSize);
      return aDiff - bDiff;
    });
    
    // Prefer WebP, then AVIF, then others
    const webpVariant = sortedVariants.find(v => v.format === 'webp');
    const avifVariant = sortedVariants.find(v => v.format === 'avif');
    
    return webpVariant || avifVariant || sortedVariants[0];
  };

  const optimalVariant = getOptimalImageVariant();
  
  return (
    <div 
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-200 flex-shrink-0',
        sizeClasses,
        className
      )}
    >
      <Image
        src={optimalVariant.url}
        alt={avatar.altText}
        width={optimalVariant.width}
        height={optimalVariant.height}
        className="object-cover w-full h-full"
        placeholder={optimalVariant.blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={optimalVariant.blurDataUrl}
        sizes={`${size === 'sm' ? '32px' : size === 'md' ? '48px' : '64px'}`}
        priority={false}
      />
      
      {/* Accessibility enhancement for screen readers */}
      <span className="sr-only">
        Avatar representing {avatar.demographics.familyStructure} family member, 
        {avatar.demographics.ageRange} years old
        {avatar.demographics.ethnicity && `, ${avatar.demographics.ethnicity}`}
        {avatar.demographics.accessibility && `, ${avatar.demographics.accessibility}`}
      </span>
    </div>
  );
}
