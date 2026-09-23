'use client'

import Link from 'next/link'
import {useRef} from 'react'
import {BookCover, type CoverSource} from './BookCover'
import {clubSelectionLabel} from '@/lib/club-selection-dates'
import {collectionTypeLabel} from '@/lib/collection-type'

export type CarouselBook = {
  _id: string
  title: string
  authors?: string[] | null
  googleBooksId?: string | null
  publishedDate?: string | null
  isbn10?: string | null
  isbn13?: string | null
  edition?: CoverSource | null
  coverOverride?: CoverSource['coverOverride']
  cover?: {url?: string | null} | null
}

export type CarouselCollection = {
  _id: string
  title: string
  slug?: string | null
  collectionType?: string | null
  description?: string | null
  curator?: {name?: string | null} | null
  source?: {name?: string | null; url?: string | null} | null
  totalSelections?: number | null
  books: {
    selectionNumber?: number | null
    month?: string | number | null
    year?: number | null
    selectionDate?: string | null
    book?: CarouselBook | null
  }[]
}

function bookHref(book: CarouselBook) {
  return book.googleBooksId ? `/search/${book.googleBooksId}` : '#'
}

export function CollectionCarousel({collection}: {collection: CarouselCollection}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const entries = collection.books.filter((entry) => entry.book)
  const count = collection.totalSelections || entries.length
  const href = collection.slug ? `/collections/${collection.slug}` : undefined

  function scrollByPage(direction: -1 | 1) {
    const node = scrollerRef.current
    if (!node) return
    node.scrollBy({left: direction * Math.min(node.clientWidth * 0.86, 640), behavior: 'smooth'})
  }

  return (
    <section className="collection-feature overflow-hidden" aria-labelledby={`${collection._id}-title`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-stretch">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="pill inline-block px-3 py-1 text-xs font-medium uppercase tracking-[0.14em]">
              {collectionTypeLabel(collection.collectionType)}
            </p>
            <h2
              id={`${collection._id}-title`}
              className="mt-4 font-[family-name:var(--font-display)] text-[2.15rem] leading-[1.05] tracking-[-0.03em] sm:text-4xl"
            >
              {collection.title}
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {[collection.curator?.name ? `Curated by ${collection.curator.name}` : null, count ? `${count} selections` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {collection.description ? (
              <p className="mt-4 max-w-sm text-[0.98rem] leading-7 text-[var(--muted)]">{collection.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {href ? (
              <Link href={href} className="pill is-active px-4 py-2 text-sm">
                See all {count || ''}
              </Link>
            ) : null}
            {collection.source?.url ? (
              <a href={collection.source.url} className="pill px-4 py-2 text-sm" rel="noreferrer">
                Official list
              </a>
            ) : null}
            <div className="ml-auto flex gap-2 lg:ml-0">
              <button
                type="button"
                className="pill grid h-10 w-10 place-items-center text-lg leading-none"
                aria-label={`Previous books in ${collection.title}`}
                onClick={() => scrollByPage(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="pill grid h-10 w-10 place-items-center text-lg leading-none"
                aria-label={`Next books in ${collection.title}`}
                onClick={() => scrollByPage(1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
        <div className="relative min-w-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[var(--paper)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--paper)] to-transparent" />
          <div
            ref={scrollerRef}
            className="collection-rail -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
            tabIndex={0}
            aria-label={`${collection.title} books`}
          >
            {entries.map((entry) => {
              const book = entry.book!
              const year = book.publishedDate?.slice(0, 4)
              const selected = clubSelectionLabel(collection, entry)
              return (
                <Link
                  key={`${collection._id}-${entry.selectionNumber}-${book._id}`}
                  href={bookHref(book)}
                  className="group w-[138px] shrink-0 snap-start sm:w-[156px]"
                >
                  <div className="relative">
                    {selected ? (
                      <span className="absolute left-2 top-2 z-10 whitespace-nowrap rounded-full bg-[var(--ink)] px-2 py-0.5 text-[11px] font-medium text-[var(--paper)]">
                        {selected}
                      </span>
                    ) : null}
                    <BookCover
                      cover={book.edition || {...book, coverUrl: book.cover?.url}}
                      title={book.title}
                      className="aspect-[2/3] w-full"
                    />
                  </div>
                  <p className="mt-3 line-clamp-2 font-medium leading-snug tracking-[-0.01em]">{book.title}</p>
                  <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                    {book.authors?.filter(Boolean).join(', ') || 'Author unknown'}
                  </p>
                  {year ? <p className="mt-1 text-xs text-[var(--muted)]">{year}</p> : null}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
