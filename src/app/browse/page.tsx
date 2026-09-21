import {Suspense} from 'react'
import Form from 'next/form'
import Link from 'next/link'
import {searchBooks} from '@/lib/book-search'
import {BookSearchError, MAX_SEARCH_PAGE, SEARCH_PAGE_SIZE, searchInputSchema, type BookSearchInput} from '@/lib/open-library'
import {SearchBookCover} from '@/components/SearchBookCover'
import {RetryBookSearch} from '@/components/RetryBookSearch'
import {EmptyState} from '@/components/States'
import {PageHeader} from '@/components/PageHeader'

export const metadata = {title: 'Search books · Read Evermore'}

async function SearchResults({input}: {input: BookSearchInput}) {
  let result
  try {
    result = await searchBooks(input)
  } catch (error) {
    return (
      <div role="alert" className="surface p-7">
        <h2 className="text-xl">Search couldn’t be completed</h2>
        <p className="mt-2 text-[var(--muted)]">
          {error instanceof BookSearchError ? error.message : 'Please try your search again shortly.'}
        </p>
        {error instanceof BookSearchError && error.retryAfter > 0 ? (
          <p className="mt-2 text-sm">Try again in {error.retryAfter} seconds.</p>
        ) : null}
        <RetryBookSearch />
      </div>
    )
  }
  const pages = Math.min(MAX_SEARCH_PAGE, Math.ceil(result.total / SEARCH_PAGE_SIZE))
  function pageHref(page: number) {
    return `/browse?${new URLSearchParams({...input, page: String(page)})}`
  }
  return (
    <section aria-label="Search results">
      <p role="status" className="text-sm text-[var(--muted)]">
        {result.exact ? '' : 'About '}{result.total.toLocaleString('en-US')} {result.total === 1 ? 'book' : 'books'} matching “{input.q}”
      </p>
      {result.books.length ? (
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {result.books.map((book) => (
            <a key={book.key} href={`https://openlibrary.org${book.key}`} target="_blank" rel="noopener noreferrer" className="group block">
              <SearchBookCover coverId={book.coverId} title={book.title} />
              <h2 className="mt-3 font-medium leading-snug">{book.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{book.authors.join(', ') || 'Author unknown'}</p>
              {book.year ? <p className="mt-1 text-xs text-[var(--muted)]">First published {book.year}</p> : null}
              {book.editionCount ? <p className="mt-1 text-xs text-[var(--muted)]">{book.editionCount} {book.editionCount === 1 ? 'edition' : 'editions'}</p> : null}
              <p className="mt-2 text-xs text-[var(--accent)]">View on Open Library ↗<span className="sr-only"> (opens in a new tab)</span></p>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState title={result.total ? 'No books on this page' : 'No books found'} body="Try a different title, author, or ISBN, or search all fields." />
        </div>
      )}
      <nav aria-label="Search result pages" className="mt-8 flex flex-wrap items-center gap-3">
        {input.page > 1 ? <Link prefetch={false} href={pageHref(input.page - 1)} className="pill px-4 py-2 text-sm">Previous</Link> : null}
        {input.page < pages ? <Link prefetch={false} href={pageHref(input.page + 1)} className="pill px-4 py-2 text-sm">Next</Link> : null}
        {result.total > 0 ? <p className="text-sm text-[var(--muted)]">Page {input.page}{input.page <= pages ? ` of ${pages}` : ''}</p> : null}
      </nav>
      {pages === MAX_SEARCH_PAGE ? <p className="mt-3 text-sm text-[var(--muted)]">Showing the first {MAX_SEARCH_PAGE} pages. Refine your search for more specific results.</p> : null}
    </section>
  )
}

export default async function BrowsePage({searchParams}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const value = (key: string) => typeof params[key] === 'string' ? params[key] as string : undefined
  const q = value('q') || ''
  const input = searchInputSchema.safeParse({q, mode: value('mode'), sort: value('sort'), page: value('page')})
  return (
    <div>
      <PageHeader eyebrow="Browse" title="Find your next read" lede="Search Open Library by title, author, or ISBN." />
      <Form action="/browse" prefetch={false} className="mt-7 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]" key={`${q}:${value('mode')}:${value('sort')}`}>
        <label className="grid gap-2 text-sm">
          Search books
          <input name="q" type="search" defaultValue={q} required minLength={2} maxLength={200} placeholder="Title, author, or ISBN" className="field w-full" />
        </label>
        <label className="grid gap-2 text-sm">
          Search by
          <select name="mode" defaultValue={value('mode') || 'all'} className="field">
            <option value="all">All fields</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="isbn">ISBN</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Sort by
          <select name="sort" defaultValue={value('sort') || 'relevance'} className="field">
            <option value="relevance">Relevance</option>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
        </label>
        <button type="submit" className="pill is-active px-5 py-3 text-sm">Search</button>
      </Form>
      <div className="mt-10">
        {!q.trim() ? (
          <EmptyState title="What would you like to read?" body="Enter a title, an author you love, or an ISBN to find books across Open Library." />
        ) : !input.success ? (
          <p role="alert">Check your search: use 2–200 characters, a listed search type and sort order, and a page from 1 to {MAX_SEARCH_PAGE}.</p>
        ) : (
          <Suspense key={JSON.stringify(input.data)} fallback={<p role="status" className="surface p-7">Searching for books…</p>}>
            <SearchResults input={input.data} />
          </Suspense>
        )}
      </div>
      <p className="mt-10 text-sm text-[var(--muted)]">
        Book information and covers from <a href="https://openlibrary.org" className="underline">Open Library</a>. Some records may have missing details or covers.
      </p>
    </div>
  )
}
