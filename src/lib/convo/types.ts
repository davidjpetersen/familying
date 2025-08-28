export type AgeBand = "0-3"|"4-6"|"7-9"|"10-12"|"13+"

export type ConvoCard = {
  id: string
  prompt_text: string
  follow_ups: string[]
  age_variants?: Record<AgeBand, string>
  type: "question"|"would_you_rather"|"story_starter"|"game"|"gratitude"|"emotion_coach"|"repair"
  tags: Record<string, any>
  tone?: "silly"|"thoughtful"|"deep"|"mindful"
}

export type ConvoDeck = {
  id: string
  title: string
  subtitle?: string
  hero_image_url?: string
  tags?: Record<string, any>
}
