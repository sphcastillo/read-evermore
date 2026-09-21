import Link from 'next/link'
import {fetchCatalog} from '@/sanity/fetch'
import {SITE_SETTINGS_QUERY, workCardFields} from '@/sanity/queries'
import {BookCard, type WorkCardData} from '@/components/BookCard'
import {EmptyState} from '@/components/States'
import {PageHeader} from '@/components/PageHeader'

export default async function FantasyByYearPage({params}: {params: Promise<{year: string}>}) {
  const {year: yearParam} = await params
  const year = Number(yearParam)
  if (!Number.isInteger(year)) {
    return <EmptyState title="Choose a year" body="Fantasy by Year needs a four-digit publication year." />
  }

  const settings = await fetchCatalog<{ratingMethod?: string; minimumRatingCount?: number} | null>(
    SITE_SETTINGS_QUERY,
  )
  const minimum = settings?.minimumRatingCount || 3

  const ranked = await fetchCatalog<WorkCardData[]>(
    `*[_type == "work" && firstPublicationYear == $year && "fantasy" in genres[]->slug.current && ratingStats.count >= $minimum] | order(ratingStats.average desc, title asc){ ${workCardFields} }`,
    {year, minimum},
  )
  const editorial = await fetchCatalog<{
    title?: string
    slug?: string
    editorialLabel?: string
    description?: string
    works?: WorkCardData[]
  } | null>(
    `*[_type == "editorialCollection" && kind == "fantasyByYear" && year == $year && workflowStatus == "approved"][0]{
      title, "slug": slug.current, editorialLabel, description, "works": works[]->{ ${workCardFields} }
    }`,
    {year},
  )

  const years = Array.from({length: 12}, (_, index) => 2026 - index)

  return (
    <div>
      <PageHeader eyebrow="Fantasy by year" title={String(year)} lede={settings?.ratingMethod} />
      <p className="mt-2 text-sm text-[var(--muted)]">
        Minimum rating count for the ranked list: {minimum}. Source: Read Evermore ratings only.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {years.map((item) => (
          <Link
            key={item}
            href={`/browse/fantasy/${item}`}
            className={`pill px-3 py-1 text-sm ${item === year ? 'is-active' : ''}`}
          >
            {item}
          </Link>
        ))}
      </div>
      {ranked.length ? (
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {ranked.map((work) => (
            <BookCard key={work._id} work={work} fill />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="Not enough Read Evermore ratings yet"
            body={`No fantasy work first published in ${year} currently has at least ${minimum} in-app ratings. We do not invent community scores.`}
          />
        </div>
      )}
      {editorial?.works?.length ? (
        <section className="mt-12">
          <p className="pill inline-block px-3 py-1 text-sm">
            {editorial.editorialLabel || 'Editorial collection — not a community ranking'}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl">{editorial.title}</h2>
          <p className="mt-2 text-[var(--muted)]">{editorial.description}</p>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {editorial.works.map((work) => (
              <BookCard key={work._id} work={work} fill />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
