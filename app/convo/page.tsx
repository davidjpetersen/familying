'use client'

import { useEffect, useState } from 'react'
import QuickStart from '@/components/convo/QuickStart'
import DeckCard from '@/components/convo/DeckCard'
import Player from '@/components/convo/Player'
import { ConvoCard, ConvoDeck, AgeBand } from '@/lib/convo/types'
import { capture } from '@/lib/posthog'
import { useSearchParams } from 'next/navigation'

export default function ConvoHome() {
  const [decks, setDecks] = useState<(ConvoDeck & { cards_count: number })[]>([])
  const [cards, setCards] = useState<ConvoCard[]>([])
  const search = useSearchParams()
  const context = search.get('context') || undefined
  const ageBand = search.get('ageBand') as AgeBand | null

  useEffect(() => {
    capture('convo_view_home')
    fetch('/api/convo/decks').then((r) => r.json()).then(setDecks)
  }, [])

  useEffect(() => {
    if (context !== undefined) {
      fetch(`/api/convo/cards?context=${context}&ageBand=${ageBand ?? ''}`)
        .then((r) => r.json())
        .then(setCards)
    } else {
      setCards([])
    }
  }, [context, ageBand])

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <QuickStart label="Dinner" context="dinner" />
        <QuickStart label="Car" context="car" />
        <QuickStart label="Bedtime" context="bedtime" />
        <QuickStart label="Anywhere" context="" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {decks.map((d) => (
          <DeckCard key={d.id} deck={d} />
        ))}
      </div>
      {cards.length > 0 && <Player initialCards={cards} />}
    </div>
  )
}
