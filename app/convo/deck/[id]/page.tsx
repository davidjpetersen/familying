'use client'

import { useEffect, useState } from 'react'
import Player from '@/components/convo/Player'
import { ConvoCard, ConvoDeck } from '@/lib/convo/types'
import { capture } from '@/lib/posthog'

export default function DeckPage({ params }: { params: { id: string } }) {
  const [deck, setDeck] = useState<ConvoDeck | null>(null)
  const [cards, setCards] = useState<ConvoCard[]>([])
  const [play, setPlay] = useState(false)

  useEffect(() => {
    capture('convo_deck_open', { id: params.id })
    fetch(`/api/convo/decks/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        setDeck(res.deck)
        setCards(res.cards)
      })
  }, [params.id])

  if (play) return <Player initialCards={cards} />

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl">{deck?.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.id} className="border p-2">
            {c.prompt_text}
          </div>
        ))}
      </div>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => setPlay(true)}
      >
        Play
      </button>
    </div>
  )
}
