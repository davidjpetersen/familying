# Soundscapes Plugin Storage Bucket Migration

This migration creates a dedicated Supabase storage bucket for the soundscapes plugin with proper security policies.

## Overview

The migration `0002_create_storage_bucket.sql` creates:

1. **Storage Bucket**: `plugin_soundscapes` with 50MB file size limit
2. **Security Policies**: Row Level Security (RLS) for authenticated and admin users
3. **File Type Restrictions**: Only allows audio and image files
4. **Performance Indexes**: For efficient storage queries

## Bucket Configuration

### File Size Limits
- **Maximum file size**: 50MB (52,428,800 bytes)
- Suitable for high-quality audio files while preventing abuse

### Allowed MIME Types
**Audio Files:**
- `audio/mpeg` (MP3)
- `audio/wav` (WAV)
- `audio/mp3` (MP3 alternative)
- `audio/m4a` (M4A/AAC)
- `audio/ogg` (OGG Vorbis)

**Image Files (for thumbnails):**
- `image/jpeg` (JPEG)
- `image/png` (PNG)
- `image/webp` (WebP)

### Storage Structure
```
plugin_soundscapes/
├── audio/           # Audio files
├── thumbnails/      # Thumbnail images
└── temp/           # Temporary uploads
```

## Security Policies

### Read Access
- **Who**: All authenticated users
- **What**: Can read all files in the bucket
- **Purpose**: Allow users to access soundscape audio and thumbnails

### Write Access (Create/Update/Delete)
- **Who**: Admin users (verified at application layer)
- **What**: Can manage all files in the bucket
- **Purpose**: Allow administrators to upload, update, and remove soundscape content

### RLS Implementation
```sql
-- Read policy for authenticated users
create policy "Allow authenticated users to read soundscape files" on storage.objects
  for select using (
    bucket_id = 'plugin_soundscapes' 
    and auth.role() = 'authenticated'
  );

-- Admin policies for CRUD operations
create policy "Allow admins to upload soundscape files" on storage.objects
  for insert with check (
    bucket_id = 'plugin_soundscapes'
    and auth.role() = 'authenticated'
    -- Admin verification handled at application layer
  );
```

## Performance Optimizations

### Database Indexes
- **Bucket ID index**: `idx_storage_objects_bucket_id` for fast bucket filtering
- **Bucket path index**: `idx_storage_objects_bucket_path` for efficient file lookups

### Caching Strategy
The storage utilities include built-in caching for:
- File listings
- Bucket health checks
- Public URL generation

## Usage Examples

### Using Storage Utilities
```typescript
import {
  uploadFile,
  getPublicUrl,
  listFiles,
  isFileTypeAllowed,
  generateFilePath
} from '../src/utils/storage-bucket'

// Upload an audio file
const result = await uploadFile(
  generateFilePath('my-soundscape.mp3'),
  file,
  { contentType: 'audio/mpeg' }
)

// Get public URL
const url = getPublicUrl('audio/my-soundscape.mp3')

// List files in audio directory
const { files } = await listFiles('audio/', { limit: 20 })
```

### File Validation
```typescript
// Check if file type is allowed
if (!isFileTypeAllowed('audio/mpeg')) {
  throw new Error('File type not allowed')
}

// Check if file size is within limits
if (!isFileSizeAllowed(file.size)) {
  throw new Error('File too large')
}
```

## Security Considerations

### Application-Level Admin Checks
While the database policies allow authenticated users to perform CRUD operations, the application layer must verify admin status before allowing write operations.

### File Type Security
- Only safe MIME types are allowed
- No executable files (`.exe`, `.js`, `.html`)
- No archive files that could contain malicious content

### Size Limits
- 50MB limit prevents storage abuse
- Reasonable for high-quality audio files
- Small enough to maintain good performance

## Monitoring

### Health Checks
```typescript
import { checkBucketHealth } from '../src/utils/storage-bucket'

const health = await checkBucketHealth()
if (!health.exists || !health.accessible) {
  console.error('Storage bucket issue:', health.error)
}
```

### Performance Metrics
The storage utilities integrate with the performance monitoring system to track:
- Upload/download performance
- Storage usage statistics
- Error rates

## Maintenance

### Cleanup Tasks
```typescript
import { cleanupTempFiles } from '../src/utils/storage-bucket'

// Clean up temporary files older than 24 hours
const result = await cleanupTempFiles(24)
console.log(`Cleaned up ${result.deletedCount} temporary files`)
```

### Backup Considerations
- Bucket contents should be included in backup procedures
- Critical for preserving user-uploaded soundscape content
- Consider implementing automated backup rotation

## Migration Rollback

To rollback this migration:

```sql
-- Remove storage policies
drop policy if exists "Allow authenticated users to read soundscape files" on storage.objects;
drop policy if exists "Allow admins to upload soundscape files" on storage.objects;
drop policy if exists "Allow admins to update soundscape files" on storage.objects;
drop policy if exists "Allow admins to delete soundscape files" on storage.objects;

-- Remove helper function
drop function if exists public.is_admin(uuid);

-- Remove indexes
drop index if exists idx_storage_objects_bucket_id;
drop index if exists idx_storage_objects_bucket_path;

-- Remove bucket (WARNING: This will delete all files)
delete from storage.buckets where id = 'plugin_soundscapes';
```

⚠️ **Warning**: Removing the bucket will permanently delete all uploaded files!

## Testing

The migration includes comprehensive tests covering:
- Bucket creation and configuration
- Security policy validation  
- File type and size restrictions
- Performance index creation
- Helper function implementation

Run tests with:
```bash
npm test tests/unit/migration-storage.test.ts
npm test tests/unit/storage-bucket-config.test.ts
```
