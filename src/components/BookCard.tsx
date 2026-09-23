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
  ratingStats?: {average?: number | null; count?: number | null} | null
}

export function BookCard({
  work,
  large = false,
  fill = false,
  resolveMissingCover = false,
}: {
  work: WorkCardData
  large?: boolean
  fill?: boolean
  resolveMissingCover?: boolean
}) {
  const href = work.slug ? `/books/${work.slug}` : '#'
  const width = fill
    ? 'w-full'
    : large
      ? 'w-[176px] sm:w-[196px] shrink-0'
      : 'w-[148px] sm:w-[168px] shrink-0'
  return (
    <Link href={href} className={`group block ${width}`}>
      {resolveMissingCover ? <LibraryBookCover workId={work._id} cover={work.cover} title={work.title} className="aspect-[2/3] w-full" /> : <BookCover cover={work.cover} title={work.title} className="aspect-[2/3] w-full" />}
      <p className="mt-3 font-medium leading-snug tracking-[-0.01em]">{work.title}</p>
      <p className="mt-0.5 text-sm text-[var(--muted)]">
        {work.authors?.map((author) => author.name).filter(Boolean).join(', ') || 'Author unknown'}
      </p>
      {typeof work.ratingStats?.count === 'number' && work.ratingStats.count > 0 ? (
        <p className="mt-1 text-xs text-[var(--sage)]">
          {work.ratingStats.average} · {work.ratingStats.count} Read Evermore{' '}
          {work.ratingStats.count === 1 ? 'rating' : 'ratings'}
        </p>
      ) : null}
    </Link>
  )
}
