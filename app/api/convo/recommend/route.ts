import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AgeBand } from '@/lib/convo/types'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { ageBand, context, limit = 5 } = await req.json()

  const { data: cards } = await supabaseAdmin
    .from('convo_cards')
    .select('*')
    .eq('status', 'published')

  const { data: interactions } = await supabaseAdmin
    .from('convo_card_interactions')
    .select('card_id, hidden, used_at')
    .eq('user_id', userId)

  const excluded = new Set(
    (interactions || [])
      .filter(
        (i) =>
          i.hidden ||
          (i.used_at && Date.now() - new Date(i.used_at).getTime() < 14 * 24 * 3600 * 1000)
      )
      .map((i) => i.card_id)
  )

  const scored = (cards || [])
    .filter((c) => !excluded.has(c.id))
    .map((c) => {
      let score = 0
      if (context && c.tags?.context?.includes(context)) score += 0.6
      if (ageBand && c.age_variants && c.age_variants[ageBand]) score += 0.5
      return { ...c, score }
    })
    .sort((a, b) => b.score - a.score)

  const top = scored.slice(0, 20)
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[top[i], top[j]] = [top[j], top[i]]
  }

  const selected = top.slice(0, limit).map((c) => ({
    ...c,
    prompt_text:
      ageBand && c.age_variants && c.age_variants[ageBand]
        ? c.age_variants[ageBand]
        : c.prompt_text
  }))

  return NextResponse.json(selected)
}
