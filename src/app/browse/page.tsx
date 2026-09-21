import Link from 'next/link'
import {fetchCatalog} from '@/sanity/fetch'
import {GENRES_QUERY, workCardFields} from '@/sanity/queries'
import {BookCard, type WorkCardData} from '@/components/BookCard'
import {EmptyState} from '@/components/States'
import {PageHeader} from '@/components/PageHeader'

const PAGE_SIZE = 12

function worksQuery(start: number, end: number, filter: string, order: string) {
  return `*[_type == "work" && defined(slug.current)${filter}] | order(${order}) [${start}...${end}]{ ${workCardFields} }`
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const genre = typeof params.genre === 'string' ? params.genre : ''
  const year = typeof params.year === 'string' ? params.year : ''
  const minRating = typeof params.minRating === 'string' ? params.minRating : ''
  const sort = typeof params.sort === 'string' ? params.sort : 'title'
  const page = Math.max(1, Number(params.page || '1') || 1)
  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE

  const filters: string[] = []
  const groqParams: Record<string, unknown> = {}
  if (q) {
    filters.push(' && title match $q')
    groqParams.q = `*${q}*`
  }
  if (genre) {
    filters.push(' && $genre in genres[]->slug.current')
    groqParams.genre = genre
  }
  if (year) {
    filters.push(' && firstPublicationYear == $year')
    groqParams.year = Number(year)
  }
  if (minRating) {
    filters.push(' && ratingStats.average >= $minRating && ratingStats.count >= 1')
    groqParams.minRating = Number(minRating)
  }
  const filter = filters.join('')
  const order =
    sort === 'year' ? 'firstPublicationYear desc' : sort === 'rating' ? 'ratingStats.average desc' : 'title asc'

  const [genres, works, total] = await Promise.all([
    fetchCatalog<{title: string; slug?: string; parent?: {title?: string; slug?: string}}[]>(GENRES_QUERY),
    fetchCatalog<WorkCardData[]>(worksQuery(start, end, filter, order), groqParams),
    fetchCatalog<number>(`count(*[_type == "work" && defined(slug.current)${filter}])`, groqParams),
  ])

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))

  function href(next: Record<string, string | undefined>) {
    const search = new URLSearchParams()
    const merged = {q, genre, year, minRating, sort, page: String(page), ...next}
    for (const [key, value] of Object.entries(merged)) {
      if (value) search.set(key, value)
    }
    return `/browse?${search.toString()}`
  }

  return (
    <div>
      <PageHeader eyebrow="Browse" title="Every shelf we keep" />
      <form className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <input name="q" defaultValue={q} placeholder="Search titles" className="field" />
        <select name="genre" defaultValue={genre} className="field">
          <option value="">All genres</option>
          {genres.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.parent ? `${item.parent.title} / ${item.title}` : item.title}
            </option>
          ))}
        </select>
        <input name="year" defaultValue={year} placeholder="Year" className="field" />
        <select name="minRating" defaultValue={minRating} className="field">
          <option value="">Any rating</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
        <select name="sort" defaultValue={sort} className="field">
          <option value="title">Title</option>
          <option value="year">Publication year</option>
          <option value="rating">Read Evermore rating</option>
        </select>
        <button className="pill is-active px-4 py-2 text-sm md:col-span-2 lg:col-span-1">Apply</button>
      </form>
      <div className="mt-6 flex flex-wrap gap-2">
        {genres
          .filter((item) => !item.parent)
          .map((item) => (
            <Link
              key={item.slug}
              href={`/browse/${item.slug}`}
              className={`pill px-3 py-1 text-sm ${genre === item.slug ? 'is-active' : ''}`}
            >
              {item.title}
            </Link>
          ))}
      </div>
      {works?.length ? (
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {works.map((work) => (
            <BookCard key={work._id} work={work} fill />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState title="No books match these filters" body="Try another genre, year, or clear search. This catalog is small on purpose." />
        </div>
      )}
      <div className="mt-8 flex gap-3">
        {page > 1 ? (
          <Link href={href({page: String(page - 1)})} className="pill px-4 py-2 text-sm">
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={href({page: String(page + 1)})} className="pill px-4 py-2 text-sm">
            Next
          </Link>
        ) : null}
        <p className="self-center text-sm text-[var(--muted)]">
          Page {page} of {totalPages}
        </p>
      </div>
    </div>
  )
}
