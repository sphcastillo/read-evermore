import {notFound} from 'next/navigation'
import {fetchCatalog} from '@/sanity/fetch'
import {COLLECTION_BY_SLUG_QUERY} from '@/sanity/queries'
import {BookCard, type WorkCardData} from '@/components/BookCard'
import {PageHeader} from '@/components/PageHeader'

export default async function CollectionPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const collection = await fetchCatalog<{
    title: string
    description?: string
    editorialLabel?: string
    works?: WorkCardData[]
  } | null>(COLLECTION_BY_SLUG_QUERY, {slug})

  if (!collection) notFound()

  return (
    <div>
      <PageHeader eyebrow="Collection" title={collection.title} lede={collection.description} />
      {collection.editorialLabel ? (
        <p className="pill mt-4 inline-block px-3 py-1 text-sm">{collection.editorialLabel}</p>
      ) : null}
      <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {(collection.works || []).map((work) => (
          <BookCard key={work._id} work={work} fill />
        ))}
      </div>
    </div>
  )
}
