'use client'

import Link from 'next/link'
import {useEffect, useId, useRef, useState} from 'react'
import {bookTitle, coverSrc, type GoogleBook, type GoogleSearchResponse} from '@/lib/google-books'

export function GlobalBookSearch() {
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const [error, setError] = useState('')
  const [books, setBooks] = useState<GoogleBook[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  async function searchBooks(value: string) {
    const q = value.trim()
    if (q.length < 2) {
      setError('Enter at least 2 characters to search.')
      setStatus('error')
      setOpen(true)
      return
    }

    setStatus('loading')
    setError('')
    setOpen(true)

    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`)
      const data = (await response.json().catch(() => null)) as GoogleSearchResponse | null
      if (!response.ok || !data) {
        throw new Error(data?.error || 'Search couldn’t be completed.')
      }
      setBooks(data.items || [])
      setTotal(data.totalItems ?? data.items?.length ?? 0)
      setStatus('done')
    } catch (caught) {
      setBooks([])
      setTotal(0)
      setError(caught instanceof Error ? caught.message : 'Search couldn’t be completed.')
      setStatus('error')
    }
  }

  return (
    <div ref={rootRef} className="relative max-w-2xl mx-auto">
      <form
        role="search"
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void searchBooks(query)
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Search books
        </label>
        <input
          id={inputId}
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (status !== 'idle') setOpen(true)
          }}
          minLength={2}
          maxLength={200}
          placeholder="Search books by title, author, or ISBN"
          autoComplete="off"
          className="field min-w-0 flex-1"
        />
        <button type="submit" className="pill is-active shrink-0 px-4 py-2.5 text-sm" disabled={status === 'loading'}>
          {status === 'loading' ? 'Searching…' : 'Search'}
        </button>
      </form>
      {open ? (
        <div
          className="absolute inset-x-0 top-[calc(100%+10px)] z-40 max-h-[min(28rem,70vh)] overflow-auto rounded-[20px] bg-[var(--paper)] p-3 shadow-[var(--shadow)]"
          role="region"
          aria-live="polite"
          aria-label="Book search results"
        >
          {status === 'loading' ? <p className="px-3 py-4 text-sm text-[var(--muted)]">Searching for books…</p> : null}
          {status === 'error' ? (
            <div className="px-3 py-4">
              <p role="alert" className="text-sm">
                {error}
              </p>
              <button type="button" className="pill mt-3 px-4 py-2 text-sm" onClick={() => void searchBooks(query)}>
                Try again
              </button>
            </div>
          ) : null}
          {status === 'done' && !books.length ? (
            <p className="px-3 py-4 text-sm text-[var(--muted)]">No books found. Try a different title, author, or ISBN.</p>
          ) : null}
          {status === 'done' && books.length ? (
            <>
              <p className="px-3 pb-2 text-xs text-[var(--muted)]">
                {total.toLocaleString('en-US')} {total === 1 ? 'book' : 'books'} matching “{query.trim()}”
              </p>
              <ul className="grid gap-1">
                {books.map((book) => {
                  const title = bookTitle(book)
                  const authors = book.volumeInfo?.authors?.join(', ')
                  const year = book.volumeInfo?.publishedDate?.slice(0, 4)
                  const cover = coverSrc(book)
                  return (
                    <li key={book.id}>
                      <Link
                        href={`/search/${book.id}`}
                        className="flex gap-3 rounded-2xl px-3 py-2 hover:bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)]"
                        onClick={() => {
                          console.log('[search] Selected book', book)
                          setOpen(false)
                        }}
                      >
                        <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-[var(--accent-soft)]">
                          {cover ? (
                            // Google Books hosts covers on rotating hostnames; skip next/image here.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="sr-only">Cover unavailable</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium leading-snug">{title}</p>
                          <p className="mt-0.5 truncate text-sm text-[var(--muted)]">{authors || 'Author unknown'}</p>
                          {year ? <p className="mt-0.5 text-xs text-[var(--muted)]">{year}</p> : null}
                          <p className="mt-1 text-xs text-[var(--accent)]">View book</p>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
