import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: decks, error } = await supabaseAdmin
    .from('convo_decks')
    .select('id,title,subtitle,hero_image_url')
    .eq('status', 'published')

  if (error) return NextResponse.json({ error: 'failed' }, { status: 500 })

  const results = await Promise.all(
    (decks ?? []).map(async (d) => {
      const { count } = await supabaseAdmin
        .from('convo_deck_cards')
        .select('*', { count: 'exact', head: true })
        .eq('deck_id', d.id)
      return { ...d, cards_count: count || 0 }
    })
  )

  return NextResponse.json(results)
}
