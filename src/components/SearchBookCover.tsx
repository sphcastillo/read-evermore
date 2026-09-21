'use client'

import Image from 'next/image'
import {useState} from 'react'

export function SearchBookCover({coverId, title}: {coverId?: number; title: string}) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="cover-frame relative aspect-[2/3] overflow-hidden bg-[var(--accent-soft)]">
      {coverId && !failed ? (
        <Image src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg?default=false`}
          alt={`Cover of ${title}`} fill unoptimized sizes="(max-width: 640px) 45vw, 220px"
          className="object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full items-end p-4 text-sm text-[var(--muted)]">Cover unavailable</div>
      )}
    </div>
  )
}
