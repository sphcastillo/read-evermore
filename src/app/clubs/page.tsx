import Link from 'next/link'
import {fetchCatalog} from '@/sanity/fetch'
import {COMMUNITY_CLUBS_QUERY} from '@/sanity/queries'
import {EmptyState} from '@/components/States'
import {PageHeader} from '@/components/PageHeader'

export default async function ClubsPage() {
  const clubs = await fetchCatalog<
    {
      _id: string
      name: string
      slug?: string
      description?: string
      isDemoClub?: boolean
      currentRead?: {title?: string} | null
    }[]
  >(COMMUNITY_CLUBS_QUERY)

  return (
    <div>
      <PageHeader eyebrow="Book clubs" title="Read together" lede="A quiet room for one shared book at a time." />
      {clubs.length ? (
        <div className="mt-8 grid gap-4">
          {clubs.map((club) => (
            <Link key={club._id} href={`/clubs/${club.slug}`} className="surface block p-5">
              <div className="flex items-center gap-3">
                <h2 className="font-[family-name:var(--font-display)] text-3xl">{club.name}</h2>
                {club.isDemoClub ? (
                  <span className="pill px-2 py-0.5 text-xs">Demo club</span>
                ) : null}
              </div>
              <p className="mt-2 text-[var(--muted)]">{club.description}</p>
              {club.currentRead?.title ? (
                <p className="mt-3 text-sm">Current read: {club.currentRead.title}</p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No clubs yet" body="The Evermore Readers club will appear after catalog import." />
        </div>
      )}
    </div>
  )
}
