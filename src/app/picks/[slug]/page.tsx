import {notFound} from 'next/navigation'
import {fetchCatalog} from '@/sanity/fetch'
import {CELEBRITY_CLUB_BY_SLUG_QUERY} from '@/sanity/queries'
import {BookCard, type WorkCardData} from '@/components/BookCard'
import {PageHeader} from '@/components/PageHeader'

export default async function ClubArchivePage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const club = await fetchCatalog<{
    name: string
    officialUrl: string
    disclaimer?: string
    selections?: {
      _id: string
      year: number
      month: number
      sourceUrl?: string
      verifiedAt?: string
      emptyReason?: string
      works?: WorkCardData[]
    }[]
  } | null>(CELEBRITY_CLUB_BY_SLUG_QUERY, {slug})
  if (!club) notFound()

  return (
    <div>
      <PageHeader eyebrow="Celebrity picks" title={club.name} lede={club.disclaimer} />
      <a className="pill mt-4 inline-block px-4 py-2 text-sm" href={club.officialUrl}>
        Official source
      </a>
      <div className="mt-10 space-y-8">
        {(club.selections || []).map((selection) => (
          <section key={selection._id} className="surface p-5">
            <h2 className="text-xl">
              {selection.year}-{String(selection.month).padStart(2, '0')}
            </h2>
            {selection.works?.length ? (
              <div className="shelf-scroll mt-4">
                {selection.works.map((work) => (
                  <BookCard key={work._id} work={work} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted)]">
                {selection.emptyReason || 'No verified selection for this month.'}
              </p>
            )}
            {selection.sourceUrl ? (
              <p className="mt-3 text-sm">
                <a className="underline" href={selection.sourceUrl}>
                  Source
                </a>
                {selection.verifiedAt ? ` · verified ${selection.verifiedAt.slice(0, 10)}` : ''}
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  )
}
