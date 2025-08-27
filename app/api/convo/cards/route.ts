import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AgeBand } from '@/lib/convo/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const context = searchParams.get('context') || undefined
  const ageBand = searchParams.get('ageBand') as AgeBand | null
  const limit = Number(searchParams.get('limit') || '10')

  let query = supabaseAdmin
    .from('convo_cards')
    .select('*')
    .eq('status', 'published')

  if (context) query = query.contains('tags->context', [context])

  const { data: cards, error } = await query.limit(limit)

  if (error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })

  if (!cards || cards.length === 0 && context) {
    const { data: fallback } = await supabaseAdmin
      .from('convo_cards')
      .select('*')
      .eq('status', 'published')
      .limit(limit)
    return NextResponse.json(adapt(fallback || [], ageBand))
  }

  return NextResponse.json(adapt(cards, ageBand))
}

function adapt(cards: any[], ageBand: AgeBand | null) {
  return cards.map((c) => ({
    ...c,
    prompt_text:
      ageBand && c.age_variants && c.age_variants[ageBand]
        ? c.age_variants[ageBand]
        : c.prompt_text
  }))
}
