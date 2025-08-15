'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function uploadFile(
  bucket: string,
  path: string,
  file: Blob | ArrayBuffer | Buffer,
  contentType?: string
) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  })

  if (error) throw error
  return data
}

export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 60
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

