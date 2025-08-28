import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { data: deck, error } = await supabaseAdmin
    .from('convo_decks')
    .select('id,title,subtitle,hero_image_url')
    .eq('id', id)
    .eq('status', 'published')
    .single()
  if (error || !deck)
    return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data: cardsData } = await supabaseAdmin
    .from('convo_deck_cards')
    .select(
      'position, convo_cards:convo_cards(id,prompt_text,follow_ups,age_variants,type,tags,tone)'
    )
    .eq('deck_id', id)
    .order('position', { ascending: true })

  const cards = (cardsData || []).map((c: any) => c.convo_cards)

  return NextResponse.json({ deck, cards })
}
