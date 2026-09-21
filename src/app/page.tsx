import Link from 'next/link'
import {fetchCatalog} from '@/sanity/fetch'
import {DISCOVER_COLLECTIONS_QUERY, SITE_SETTINGS_QUERY} from '@/sanity/queries'
import {CollectionRow} from '@/components/CollectionRow'
import {EmptyState} from '@/components/States'
import {PageHeader} from '@/components/PageHeader'

export default async function DiscoverPage() {
  const [settings, collections] = await Promise.all([
    fetchCatalog<{
      tagline?: string
      catalogDisclaimer?: string
      openLibraryAttribution?: string
    } | null>(SITE_SETTINGS_QUERY),
    fetchCatalog<
      {
        _id: string
        title: string
        slug?: string
        description?: string
        works?: Parameters<typeof CollectionRow>[0]['works']
      }[]
    >(DISCOVER_COLLECTIONS_QUERY),
  ])

  return (
    <div>
      <PageHeader
        eyebrow="Discover"
        title={settings?.tagline || 'A home for everything you read'}
        lede="Browse a small, verified catalog. Covers stay the focus; your shelves stay yours."
      />
      <div className="mt-7 flex flex-wrap gap-2">
        <Link className="pill px-4 py-2 text-sm" href="/releases/this-week">
          This week
        </Link>
        <Link className="pill px-4 py-2 text-sm" href="/picks">
          Celebrity club picks
        </Link>
        <Link className="pill px-4 py-2 text-sm" href="/bestsellers">
          Bestseller directory
        </Link>
        <Link className="pill px-4 py-2 text-sm" href="/browse/fantasy">
          Fantasy by year
        </Link>
      </div>
      <div className="mt-12">
        {collections?.length ? (
          collections.map((collection) => (
            <CollectionRow
              key={collection._id}
              title={collection.title}
              href={`/collections/${collection.slug}`}
              description={collection.description}
              works={collection.works || []}
            />
          ))
        ) : (
          <EmptyState
            title="The shelves are still being set"
            body="No approved editorial collections are published yet. Import the catalog and approve a Discover collection to fill this page."
          />
        )}
      </div>
      <p className="mt-10 text-sm text-[var(--muted)]">{settings?.catalogDisclaimer}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{settings?.openLibraryAttribution}</p>
    </div>
  )
}
