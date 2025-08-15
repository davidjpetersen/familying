'use server';

import { createServerClient } from './server';

export async function healthcheck(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // If Supabase isn't configured, skip the check.
    return;
  }

  const supabase = createServerClient();
  const { error } = await supabase.rpc('now', undefined, { head: true, get: true });
  if (error) throw error;
}
