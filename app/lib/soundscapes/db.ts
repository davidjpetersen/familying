import { createSupabaseClient } from '@/lib/supabase';

export async function toggleFavorite({ mixId, familyId, childId }: { mixId: string; familyId: string; childId?: string | null }) {
  const supabase = createSupabaseClient();
  // Check existing
  const { data: existing } = await supabase
    .from('soundscape_favorite')
    .select('id')
    .eq('mix_id', mixId)
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    await supabase.from('soundscape_favorite').delete().eq('id', existing.id);
    return { favorited: false };
  } else {
    // Requires valid familyId per schema
    await supabase.from('soundscape_favorite').insert({ mix_id: mixId, family_id: familyId, child_id: childId ?? null });
    return { favorited: true };
  }
}

