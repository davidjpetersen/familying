import { ConvoCard } from '@/lib/convo/types'

interface Props {
  card: ConvoCard
  showFollowUps: boolean
}

export default function Card({ card, showFollowUps }: Props) {
  return (
    <div className="p-4 text-center">
      <p className="text-xl mb-4">{card.prompt_text}</p>
      {showFollowUps && card.follow_ups.length > 0 && (
        <ul className="list-disc text-left inline-block">
          {card.follow_ups.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
