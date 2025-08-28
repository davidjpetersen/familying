'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { capture } from '@/lib/posthog'

interface Props {
  label: string
  context: string
}

export default function QuickStart({ label, context }: Props) {
  const router = useRouter()
  const search = useSearchParams()
  return (
    <button
      className="px-3 py-2 bg-blue-500 text-white rounded"
      onClick={() => {
        capture('convo_quick_start_click', { context })
        const params = new URLSearchParams()
        if (context) params.set('context', context)
        const ageBand = search.get('ageBand')
        if (ageBand) params.set('ageBand', ageBand)
        router.replace(`/convo?${params.toString()}`)
      }}
    >
      {label}
    </button>
  )
}
