'use server'

import { createClient } from '@supabase/supabase-js'

export type Feature = {
  id: string
  label: string
  route: string
  tier: 'free' | 'pro'
  enabled: boolean
}

export async function getFeatures() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('features')
    .select('id,label,route,tier,enabled')
    .order('label')

  if (error) {
    console.error('Error fetching features', error)
    return [] as Feature[]
  }

  return (data as Feature[]) ?? []
}
