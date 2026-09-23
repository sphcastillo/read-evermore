'use client'

import {useEffect, useRef, useState} from 'react'
import {BookCover, type CoverSource} from './BookCover'
import {coverCandidates} from '@/lib/book-covers'

// Bound client requests so a long shelf doesn't start hundreds of lookups.
let queue = Promise.resolve()
const requests = new Map<string, Promise<CoverSource | null>>()
function lookup(workId: string) {
  const existing = requests.get(workId)
  if (existing) return existing
  const result = queue.then(async () => {
    const response = await fetch(`/api/library/covers/${encodeURIComponent(workId)}`, {method: 'POST'})
    if (!response.ok) throw new Error('Cover lookup failed')
    return (await response.json()).cover as CoverSource | null
  })
  requests.set(workId, result)
  queue = result.then(() => {}, () => { requests.delete(workId) })
  return result
}

export function LibraryBookCover({workId, cover, title, className}: {workId: string; cover?: CoverSource | null; title: string; className: string}) {
  const root = useRef<HTMLDivElement>(null)
  const [resolved, setResolved] = useState<CoverSource | null>(null)
  const missing = !coverCandidates(cover).length && !cover?.coverOverride?.asset
  useEffect(() => {
    if (!missing || !root.current) return
    let cancelled = false
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      void lookup(workId).then((value) => { if (!cancelled) setResolved(value) }).catch(() => {})
    }, {rootMargin: '200px'})
    observer.observe(root.current)
    return () => { cancelled = true; observer.disconnect() }
  }, [workId, missing])
  return <div ref={root}><BookCover cover={missing ? resolved || cover : cover} title={title} className={className} /></div>
}
