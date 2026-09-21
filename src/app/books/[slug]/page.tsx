import {notFound} from 'next/navigation'
import {fetchCatalog} from '@/sanity/fetch'
import {WORK_BY_SLUG_QUERY} from '@/sanity/queries'
import {BookCover} from '@/components/BookCover'
import {StarRating} from '@/components/StarRating'
import {ShelfButtons} from '@/components/ShelfButtons'
import {getOptionalReader} from '@/lib/reader'
import {getReaderBookState} from '@/lib/actions'

export default async function BookPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const work = await fetchCatalog<{
    _id: string
    title: string
    description?: string
    firstPublicationYear?: number
    firstPublicationDate?: string
    openLibraryWorkKey?: string
    authors?: {name?: string}[]
    genres?: {title?: string; slug?: string}[]
    cover?: Parameters<typeof BookCover>[0]['cover']
    ratingStats?: {average?: number; count?: number}
    editions?: {
      _id: string
      title?: string
      isbn13?: string
      format?: string
      market?: string
      onSaleDate?: string
      isReprint?: boolean
      firstPublicationOfWork?: boolean
      publisher?: string
    }[]
  } | null>(WORK_BY_SLUG_QUERY, {slug})

  if (!work) notFound()

  const reader = await getOptionalReader().catch(() => null)
  const state = await getReaderBookState(work._id)

  return (
    <article className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <div className="group max-w-[240px]">
        <BookCover cover={work.cover} title={work.title} priority className="aspect-[2/3] w-full" />
      </div>
      <div>
        <p className="text-sm text-[var(--muted)]">
          {work.authors?.map((author) => author.name).filter(Boolean).join(', ') || 'Author unknown'}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[2.7rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          {work.title}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          First published {work.firstPublicationYear || 'year unknown'}
          {work.firstPublicationDate ? ` · dated ${work.firstPublicationDate}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {work.genres?.map((genre) => (
            <a key={genre.slug} href={`/browse/${genre.slug}`} className="pill px-3 py-1 text-sm">
              {genre.title}
            </a>
          ))}
        </div>
        <p className="mt-6 max-w-2xl leading-7">
          {work.description || 'No description is in this catalog yet. We do not invent one.'}
        </p>
        <div className="mt-6">
          <ShelfButtons workId={work._id} status={state.status} signedIn={Boolean(reader)} />
        </div>
        <div className="mt-6 max-w-md">
          <StarRating workId={work._id} value={state.rating} signedIn={Boolean(reader)} />
        </div>
        {!reader ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Sign in to keep ratings and shelves across sessions.</p>
        ) : (
          <p className="mt-3 text-sm text-[var(--sage)]">Saved to your Read Evermore shelves.</p>
        )}
        {work.ratingStats?.count ? (
          <p className="mt-4 text-sm">
            Read Evermore average {work.ratingStats.average} from {work.ratingStats.count} ratings. This is not a
            Goodreads score.
          </p>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">No Read Evermore ratings yet.</p>
        )}
        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Editions in this catalog</h2>
          <ul className="mt-4 space-y-3">
            {(work.editions || []).map((edition) => (
              <li key={edition._id} className="surface px-4 py-3 text-sm">
                <p className="font-medium">
                  {edition.title || work.title}
                  {edition.firstPublicationOfWork ? ' · First publication' : ''}
                  {edition.isReprint ? ' · Reprint' : ''}
                </p>
                <p className="text-[var(--muted)]">
                  {[edition.format, edition.market, edition.publisher, edition.onSaleDate, edition.isbn13]
                    .filter(Boolean)
                    .join(' · ') || 'Edition details incomplete'}
                </p>
              </li>
            ))}
          </ul>
        </section>
        {work.openLibraryWorkKey ? (
          <p className="mt-6 text-sm text-[var(--muted)]">
            Open Library:{' '}
            <a className="underline" href={`https://openlibrary.org/works/${work.openLibraryWorkKey}`}>
              {work.openLibraryWorkKey}
            </a>
          </p>
        ) : null}
      </div>
    </article>
  )
}
