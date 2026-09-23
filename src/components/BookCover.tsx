import Image from 'next/image'
import {coverSrc} from '@/sanity/image'

export type CoverSource = {
  coverUrl?: string | null
  coverOpenLibraryId?: string | null
  coverOverride?: {asset?: {_id?: string; url?: string}; alt?: string} | null
}

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
  const src = coverSrc(cover || undefined)
  return (
    <div className={`cover-frame relative overflow-hidden bg-(--accent-soft) ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={`Cover of ${title}`}
          fill
          sizes="(max-width: 768px) 40vw, 180px"
          className="object-cover"
          priority={priority}
          unoptimized={src.includes('books.google')}
        />
      ) : (
        <div className="flex h-full items-end p-3 text-sm text-muted">Cover not in our catalog yet</div>
      )}
    </div>
  )
}
