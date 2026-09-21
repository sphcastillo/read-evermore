import {fetchCatalog} from '@/sanity/fetch'
import {SITE_SETTINGS_QUERY, workCardFields} from '@/sanity/queries'
import {BookCard, type WorkCardData} from '@/components/BookCard'
import {EmptyState} from '@/components/States'
import {PageHeader} from '@/components/PageHeader'

const WINDOWS = {
  'this-week': {title: 'This week', daysBack: 7, daysForward: 0},
  'this-month': {title: 'This month', daysBack: 31, daysForward: 0},
  upcoming: {title: 'Upcoming', daysBack: 0, daysForward: 180},
  recent: {title: 'Recent releases', daysBack: 120, daysForward: 0},
} as const

function iso(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default async function ReleasesPage({params}: {params: Promise<{window: string}>}) {
  const {window: windowParam} = await params
  const config = WINDOWS[windowParam as keyof typeof WINDOWS]
  const settings = await fetchCatalog<{catalogDisclaimer?: string} | null>(SITE_SETTINGS_QUERY)

  if (!config) {
    return <EmptyState title="Unknown release window" body="Choose this week, this month, upcoming, or recent." />
  }

  const today = new Date()
  const start = new Date(today)
  const end = new Date(today)
  start.setDate(today.getDate() - config.daysBack)
  end.setDate(today.getDate() + config.daysForward)
  const from = config.daysForward && !config.daysBack ? iso(today) : iso(start)
  const to = config.daysBack && !config.daysForward ? iso(today) : iso(end)

  const editions = await fetchCatalog<
    {
      _id: string
      onSaleDate?: string
      isReprint?: boolean
      firstPublicationOfWork?: boolean
      market?: string
      work?: WorkCardData & {_id: string}
    }[]
  >(
    `*[_type == "edition" && defined(onSaleDate) && onSaleDate >= $from && onSaleDate <= $to] | order(onSaleDate desc){
      _id, onSaleDate, isReprint, firstPublicationOfWork, market,
      "work": work->{ ${workCardFields} }
    }`,
    {from, to},
  )

  return (
    <div>
      <PageHeader
        eyebrow="New releases"
        title={config.title}
        lede="Dates are edition on-sale dates. Reprints are labeled so an older work is not presented as a new book. Market is shown when we have it."
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {Object.entries(WINDOWS).map(([slug, item]) => (
          <a
            key={slug}
            href={`/releases/${slug}`}
            className={`pill px-3 py-1 text-sm ${slug === windowParam ? 'is-active' : ''}`}
          >
            {item.title}
          </a>
        ))}
      </div>
      {editions.length ? (
        <ul className="mt-10 space-y-4">
          {editions.map((edition) =>
            edition.work ? (
              <li key={edition._id} className="surface flex gap-4 p-4">
                <div className="w-24">
                  <BookCard work={edition.work} fill />
                </div>
                <div className="pt-2 text-sm">
                  <p className="font-medium">{edition.work.title}</p>
                  <p className="text-[var(--muted)]">
                    On sale {edition.onSaleDate}
                    {edition.market ? ` · ${edition.market}` : ''}
                  </p>
                  <p>
                    {edition.firstPublicationOfWork
                      ? 'First publication of this work'
                      : edition.isReprint
                        ? 'Reprint / reissue — not a new work'
                        : 'Publication status not fully verified'}
                  </p>
                </div>
              </li>
            ) : null,
          )}
        </ul>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="No cataloged releases in this window"
            body="Read Evermore only lists editions we have imported. Empty here means a coverage gap, not that nothing was published."
          />
        </div>
      )}
      <p className="mt-8 text-sm text-[var(--muted)]">{settings?.catalogDisclaimer}</p>
    </div>
  )
}
