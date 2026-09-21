import {fetchCatalog} from '@/sanity/fetch'
import {BESTSELLER_SOURCES_QUERY} from '@/sanity/queries'
import {EmptyState} from '@/components/States'
import {PageHeader} from '@/components/PageHeader'

export default async function BestsellersPage() {
  const sources = await fetchCatalog<
    {name: string; officialUrl: string; lastVerifiedAt?: string; notes?: string}[]
  >(BESTSELLER_SOURCES_QUERY)

  return (
    <div>
      <PageHeader
        eyebrow="Bestsellers"
        title="Official lists"
        lede="We link out to official bestseller pages. Rankings are not copied, scraped, or republished here."
      />
      {sources.length ? (
        <ul className="mt-8 space-y-4">
          {sources.map((source) => (
            <li key={source.officialUrl} className="surface p-5">
              <a className="text-xl" href={source.officialUrl} rel="noreferrer">
                {source.name}
              </a>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Last verified {source.lastVerifiedAt ? source.lastVerifiedAt.slice(0, 10) : 'unknown'}
              </p>
              {source.notes ? <p className="mt-2 text-sm">{source.notes}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState title="Directory not imported yet" body="Official NYT, LAT, and Publishers Weekly links will appear after catalog import." />
        </div>
      )}
    </div>
  )
}
