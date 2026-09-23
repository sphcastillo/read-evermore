'use client'

import Image from 'next/image'
import {useState} from 'react'
import {coverUrls} from '@/sanity/image'
import type {CoverSource} from '@/lib/book-covers'
export type {CoverSource} from '@/lib/book-covers'

export function BookCover({
  cover,
  title,
  priority = false,
  className = '',
}: {
  cover?: CoverSource | null
  title: string
  priority?: boolean
  className?: string
}) {
  const urls = coverUrls(cover)
  return <CoverImage key={urls.join('|')} urls={urls} title={title} alt={cover?.coverOverride?.alt} priority={priority} className={className} />
}

function CoverImage({urls, title, alt, priority, className}: {urls: string[]; title: string; alt?: string; priority: boolean; className: string}) {
  const [index, setIndex] = useState(0)
  const src = urls[index]
  return (
    <div className={`cover-frame relative overflow-hidden bg-(--accent-soft) ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={index === 0 && alt ? alt : `Cover of ${title}`}
          fill
          sizes="(max-width: 768px) 40vw, 180px"
          className="object-cover"
          priority={priority}
          unoptimized={src.includes('books.google') || src.includes('covers.openlibrary.org')}
          onError={() => setIndex((current) => current + 1)}
        />
      ) : (
        <div className="flex h-full items-end p-3 text-sm text-muted">Cover not in our catalog yet</div>
      )}
    </div>
  )
}
