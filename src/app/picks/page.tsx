import Link from 'next/link'
import {fetchCatalog} from '@/sanity/fetch'
import {CELEBRITY_CLUBS_QUERY} from '@/sanity/queries'
import {BookCard, type WorkCardData} from '@/components/BookCard'
import {EmptyState} from '@/components/States'
import {PageHeader} from '@/components/PageHeader'

export default async function PicksPage() {
  const clubs = await fetchCatalog<
    {
      name: string
      slug?: string
      officialUrl: string
      disclaimer?: string
      selections?: {
        year: number
        month: number
        sourceUrl?: string
        verifiedAt?: string
        emptyReason?: string
        works?: WorkCardData[]
      }[]
    }[]
  >(CELEBRITY_CLUBS_QUERY)

  return (
    <div>
      <PageHeader
        eyebrow="Celebrity book clubs"
        title="Verified picks only"
        lede="Read Evermore is not affiliated with Reese’s Book Club, Read with Jenna, Oprah’s Book Club, or GMA Book Club. Months without a verified source stay empty."
      />
      {clubs.length ? (
        clubs.map((club) => {
          const current = club.selections?.[0]
          return (
            <section key={club.slug} className="mt-10 surface p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-3xl">{club.name}</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">{club.disclaimer}</p>
                </div>
                <div className="flex gap-2">
                  <a className="pill px-3 py-1 text-sm" href={club.officialUrl} rel="noreferrer">
                    Official site
                  </a>
                  <Link className="pill px-3 py-1 text-sm" href={`/picks/${club.slug}`}>
                    Archive
                  </Link>
                </div>
              </div>
              {current?.works?.length ? (
                <div className="shelf-scroll mt-6">
                  {current.works.map((work) => (
                    <BookCard key={work._id} work={work} />
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-[var(--muted)]">
                  {current?.emptyReason || 'No verified selection for the latest month in this catalog.'}
                </p>
              )}
              {current?.sourceUrl ? (
                <p className="mt-3 text-sm">
                  Source{' '}
                  <a className="underline" href={current.sourceUrl}>
                    {current.sourceUrl}
                  </a>
                  {current.verifiedAt ? ` · verified ${current.verifiedAt.slice(0, 10)}` : ''}
                </p>
              ) : null}
            </section>
          )
        })
      ) : (
        <div className="mt-8">
          <EmptyState title="Clubs not imported yet" body="The four celebrity clubs will appear after the catalog import, even if some months have no verified pick." />
        </div>
      )}
    </div>
  )
}
