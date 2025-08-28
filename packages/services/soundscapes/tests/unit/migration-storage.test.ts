import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'

describe('Storage Bucket Migration', () => {
  const migrationPath = path.join(__dirname, '../../migrations/0002_create_storage_bucket.sql')
  const migrationContent = fs.readFileSync(migrationPath, 'utf8')

  describe('Migration File Structure', () => {
    it('should exist and be readable', () => {
      expect(fs.existsSync(migrationPath)).toBe(true)
      expect(migrationContent).toBeTruthy()
      expect(migrationContent.length).toBeGreaterThan(0)
    })

    it('should create plugin_soundscapes bucket', () => {
      expect(migrationContent).toContain("insert into storage.buckets")
      expect(migrationContent).toContain("'plugin_soundscapes'")
    })

    it('should set reasonable file size limit', () => {
      expect(migrationContent).toContain("52428800") // 50MB
    })

    it('should include allowed MIME types', () => {
      expect(migrationContent).toContain("'audio/mpeg'")
      expect(migrationContent).toContain("'audio/wav'")
      expect(migrationContent).toContain("'audio/mp3'")
      expect(migrationContent).toContain("'image/jpeg'")
      expect(migrationContent).toContain("'image/png'")
    })
  })

  describe('RLS Policies', () => {
    it('should enable RLS on storage.objects', () => {
      expect(migrationContent).toContain("alter table storage.objects enable row level security")
    })

    it('should create read policy for authenticated users', () => {
      expect(migrationContent).toContain("create policy")
      expect(migrationContent).toContain("for select")
      expect(migrationContent).toContain("auth.role() = 'authenticated'")
    })

    it('should create CRUD policies for admin users', () => {
      expect(migrationContent).toContain("for insert")
      expect(migrationContent).toContain("for update")
      expect(migrationContent).toContain("for delete")
    })

    it('should reference plugin_soundscapes bucket in policies', () => {
      const policyMatches = migrationContent.match(/bucket_id = 'plugin_soundscapes'/g)
      expect(policyMatches).toBeTruthy()
      expect(policyMatches?.length).toBeGreaterThanOrEqual(4) // At least 4 policies
    })
  })

  describe('Helper Functions', () => {
    it('should create is_admin function', () => {
      expect(migrationContent).toContain("create or replace function public.is_admin")
      expect(migrationContent).toContain("returns boolean")
    })

    it('should grant execute permission on is_admin function', () => {
      expect(migrationContent).toContain("grant execute on function public.is_admin to authenticated")
    })
  })

  describe('Performance Indexes', () => {
    it('should create bucket_id index', () => {
      expect(migrationContent).toContain("create index")
      expect(migrationContent).toContain("idx_storage_objects_bucket_id")
      expect(migrationContent).toContain("storage.objects(bucket_id)")
    })

    it('should create bucket_path index', () => {
      expect(migrationContent).toContain("idx_storage_objects_bucket_path")
      expect(migrationContent).toContain("storage.objects(bucket_id, name)")
    })
  })

  describe('Security Configuration', () => {
    it('should make bucket public for reading', () => {
      expect(migrationContent).toContain("true, -- Public bucket for reading")
    })

    it('should not allow dangerous MIME types', () => {
      // Should not include executable or script types
      expect(migrationContent).not.toContain("'application/x-executable'")
      expect(migrationContent).not.toContain("'application/javascript'")
      expect(migrationContent).not.toContain("'text/html'")
      expect(migrationContent).not.toContain("'application/octet-stream'")
    })
  })

  describe('Migration Comments', () => {
    it('should have descriptive comments', () => {
      expect(migrationContent).toContain("-- Create plugin_soundscapes storage bucket")
      expect(migrationContent).toContain("-- Policy:")
      expect(migrationContent).toContain("-- Enable RLS")
    })

    it('should explain the purpose', () => {
      expect(migrationContent).toContain("storage bucket for soundscape audio files")
    })
  })
})
