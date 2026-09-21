'use client'

import {ErrorState} from '@/components/States'

export default function Error({error, reset}: {error: Error; reset: () => void}) {
  return (
    <div>
      <ErrorState title="We could not load this page" body={error.message || 'Try again in a moment.'} />
      <button className="pill mt-4 px-4 py-2 text-sm" onClick={reset}>
        Retry
      </button>
    </div>
  )
}
