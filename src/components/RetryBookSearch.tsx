'use client'

import {useTransition} from 'react'
import {useRouter} from 'next/navigation'

export function RetryBookSearch() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button type="button" disabled={pending} className="pill mt-4 px-4 py-2 text-sm disabled:opacity-50"
      onClick={() => start(() => router.refresh())}>
      {pending ? 'Searching…' : 'Try again'}
    </button>
  )
}
