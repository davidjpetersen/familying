import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { cardId, action, rating } = await req.json()

  const { data: existing } = await supabaseAdmin
    .from('convo_card_interactions')
    .select('id')
    .eq('user_id', userId)
    .eq('card_id', cardId)
    .maybeSingle()

  const payload: any = {
    user_id: userId,
    card_id: cardId,
    updated_at: new Date().toISOString()
  }

  if (action === 'favorite') payload.favorite = true
  if (action === 'hide') payload.hidden = true
  if (action === 'rate' && rating) payload.rating = rating
  if (action === 'used') payload.used_at = new Date().toISOString()

  if (existing) {
    const { error } = await supabaseAdmin
      .from('convo_card_interactions')
      .update(payload)
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: 'failed' }, { status: 500 })
  } else {
    const { error } = await supabaseAdmin
      .from('convo_card_interactions')
      .insert(payload)
    if (error) return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
