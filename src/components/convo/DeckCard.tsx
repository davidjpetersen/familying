import Link from 'next/link'
import { ConvoDeck } from '@/lib/convo/types'

interface Props {
  deck: ConvoDeck & { cards_count?: number }
}

export default function DeckCard({ deck }: Props) {
  return (
    <Link href={`/convo/deck/${deck.id}`} className="border rounded p-2 block">
      {deck.hero_image_url && (
        <img src={deck.hero_image_url} alt="" className="w-full h-32 object-cover rounded" />
      )}
      <h3 className="font-semibold mt-2">{deck.title}</h3>
      {deck.subtitle && <p className="text-sm">{deck.subtitle}</p>}
      <p className="text-xs mt-1">{deck.cards_count ?? 0} cards</p>
    </Link>
  )
}
