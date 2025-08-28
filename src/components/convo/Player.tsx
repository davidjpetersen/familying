'use client'

import { useEffect, useState } from 'react'
import Card from './Card'
import { ConvoCard } from '@/lib/convo/types'
import { capture } from '@/lib/posthog'

interface Props {
  initialCards: ConvoCard[]
}

export default function Player({ initialCards }: Props) {
  const [cards] = useState(initialCards)
  const [index, setIndex] = useState(0)
  const [showFollowUps, setShowFollowUps] = useState(false)

  const card = cards[index]

  useEffect(() => {
    if (card) capture('convo_card_view', { cardId: card.id })
  }, [card])

  async function interact(action: 'favorite' | 'hide' | 'used') {
    await fetch('/api/convo/interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id, action })
    })
  }

  function next() {
    setShowFollowUps(false)
    setIndex((i) => (i + 1) % cards.length)
  }

  if (!card) return null

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <Card card={card} showFollowUps={showFollowUps} />
      </div>
      <div className="p-4 flex justify-center gap-4 text-2xl">
        <button aria-label="Favorite" onClick={() => { capture('convo_card_favorite', { cardId: card.id }); interact('favorite') }}>★</button>
        <button aria-label="Hide" onClick={() => { capture('convo_card_hide', { cardId: card.id }); interact('hide'); next() }}>🙈</button>
        <button aria-label="Next" onClick={() => { capture('convo_card_used', { cardId: card.id }); interact('used'); next() }}>▶</button>
      </div>
      {card.follow_ups.length > 0 && (
        <button
          className="absolute top-2 right-2 underline"
          onClick={() => setShowFollowUps((s) => !s)}
        >
          {showFollowUps ? 'Hide follow-ups' : 'Show follow-ups'}
        </button>
      )}
    </div>
  )
}
