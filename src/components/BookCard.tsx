import Link from 'next/link'
import {BookCover, type CoverSource} from './BookCover'
import {LibraryBookCover} from './LibraryBookCover'

export type WorkCardData = {
  _id: string
  title: string
  slug?: string | null
  firstPublicationYear?: number | null
  authors?: {name?: string | null}[] | null
  cover?: CoverSource | null
  myRating?: number | null
  ratingStats?: {average?: number | null; count?: number | null} | null
}

export function BookCard({
  work,
  large = false,
  fill = false,
  compact = false,
  resolveMissingCover = false,
}: {
  work: WorkCardData
  large?: boolean
  fill?: boolean
  compact?: boolean
  resolveMissingCover?: boolean
}) {
  const href = work.slug ? `/books/${work.slug}` : '#'
  const width = fill
    ? 'w-full'
    : compact
      ? 'w-[104px] sm:w-[112px] shrink-0'
      : large
        ? 'w-[176px] sm:w-[196px] shrink-0'
        : 'w-[148px] sm:w-[168px] shrink-0'
  return (
    <Link href={href} className={`group block ${width}`}>
      {resolveMissingCover ? <LibraryBookCover workId={work._id} cover={work.cover} title={work.title} className="aspect-[2/3] w-full" /> : <BookCover cover={work.cover} title={work.title} className="aspect-[2/3] w-full" />}
      <p className={`font-medium leading-snug tracking-[-0.01em] ${compact ? 'mt-2 line-clamp-2 text-sm' : 'mt-3'}`}>{work.title}</p>
      <p className={`mt-0.5 text-[var(--muted)] ${compact ? 'truncate text-xs' : 'text-sm'}`}>
        {work.authors?.map((author) => author.name).filter(Boolean).join(', ') || 'Author unknown'}
      </p>
      {compact && work.firstPublicationYear ? (
        <p className="mt-0.5 text-xs text-[var(--muted)]">{work.firstPublicationYear}</p>
      ) : null}
      {typeof work.myRating === 'number' ? <p className="mt-1 text-xs text-[var(--sage)]" aria-label={`Your rating: ${work.myRating} out of 5 stars`}>Your rating: {work.myRating} ★</p> : null}
      {typeof work.ratingStats?.count === 'number' && work.ratingStats.count > 0 ? (
        <p className="mt-1 text-xs text-[var(--sage)]">
          {work.ratingStats.average} · {work.ratingStats.count} Read Evermore{' '}
          {work.ratingStats.count === 1 ? 'rating' : 'ratings'}
        </p>
      ) : null}
    </Link>
  )
}
