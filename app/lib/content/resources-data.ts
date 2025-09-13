/**
 * Resource Preview Mock Data
 * Constitutional compliance: Transparent value proposition, accessible resources
 */

import { ResourcePreview, ResourceCategory } from '@/lib/types/marketing';

export const mockResources: ResourcePreview[] = [
  {
    id: '1',
    title: 'Family Gratitude Journal',
    description: 'Beautiful printable pages to help families reflect together',
    category: ResourceCategory.CONVERSATION_STARTERS,
    thumbnailImage: '/images/gratitude-journal-thumb.jpg',
    downloadUrl: '/resources/gratitude-journal.pdf',
    isPremium: false,
    fileFormat: 'PDF',
    fileSize: 2048
  },
  {
    id: '2',
    title: 'Nature Scavenger Hunt',
    description: 'Get outside and explore nature together with this fun activity',
    category: ResourceCategory.ACTIVITY_GUIDES,
    thumbnailImage: '/images/nature-hunt-thumb.jpg',
    downloadUrl: '/resources/nature-scavenger-hunt.pdf',
    isPremium: false,
    fileFormat: 'PDF',
    fileSize: 1536
  },
  {
    id: '3',
    title: 'Bedtime Story Prompts',
    description: 'Creative prompts to make bedtime stories more engaging',
    category: ResourceCategory.BEDTIME_ROUTINES,
    thumbnailImage: '/images/bedtime-prompts-thumb.jpg',
    downloadUrl: '/resources/bedtime-prompts.pdf',
    isPremium: false,
    fileFormat: 'PDF',
    fileSize: 1024
  }
];