import { z } from 'zod'

// Soundscape categories enum
export const SoundscapeCategory = z.enum(['Sleep', 'Nature', 'White Noise', 'Focus'])

// Base soundscape schema
export const CreateSoundscapeSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .default(''),
  category: SoundscapeCategory,
  audio_url: z.string()
    .url('Must be a valid URL')
    .refine((url) => {
      try {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname.toLowerCase()
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']
        return audioExtensions.some(ext => pathname.endsWith(ext))
      } catch {
        return false
      }
    }, 'Must be a valid audio file URL'),
  thumbnail_url: z.string()
    .url('Must be a valid URL')
    .optional(),
  is_published: z.boolean().default(true),
  sort_order: z.number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order must be non-negative')
    .default(0),
  duration_seconds: z.number()
    .int('Duration must be an integer')
    .positive('Duration must be positive')
    .optional()
})

// Update schema (allows partial updates)
export const UpdateSoundscapeSchema = CreateSoundscapeSchema.partial()

// Query parameters for list endpoints
export const ListSoundscapesQuery = z.object({
  category: SoundscapeCategory.optional(),
  is_published: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sort_by: z.enum(['title', 'created_at', 'sort_order']).default('sort_order'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

// Storage import schema
export const StorageImportSchema = z.object({
  files: z.array(z.string().min(1, 'File path cannot be empty'))
    .min(1, 'At least one file must be selected')
    .max(50, 'Cannot import more than 50 files at once')
})

// ID parameter validation
export const IdParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
})

// Type exports for use in API routes
export type CreateSoundscapeInput = z.infer<typeof CreateSoundscapeSchema>
export type UpdateSoundscapeInput = z.infer<typeof UpdateSoundscapeSchema>
export type ListSoundscapesQuery = z.infer<typeof ListSoundscapesQuery>
export type StorageImportInput = z.infer<typeof StorageImportSchema>
export type IdParam = z.infer<typeof IdParamSchema>
