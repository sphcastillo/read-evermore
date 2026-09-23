import {getMyBooks} from '@/lib/actions'
import {BookCard, type WorkCardData} from '@/components/BookCard'
import {EmptyState} from '@/components/States'
import {PageHeader} from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function MyBooksPage() {
  try {
    const data = (await getMyBooks()) as {
      shelves?: {
        _id: string
        name: string
        kind: string
        entries?: {work?: WorkCardData | null}[]
      }[]
    }

    return (
      <div>
        <PageHeader
          eyebrow="My Books"
          title="Your reading home"
          lede="Current reads, books you've read, and private shelves. This space belongs to you."
        />
        <div className="mt-10 space-y-12">
          {(data.shelves || []).map((shelf) => (
            <section key={shelf._id}>
              <h2 className="font-display text-[2rem] tracking-[-0.03em]">
                {shelf.kind === 'finished' ? 'Read' : shelf.name}
              </h2>
              {shelf.entries?.length ? (
                <div className="shelf-scroll -mx-1 mt-5 px-1">
                  {shelf.entries.map((entry, index) =>
                    entry.work ? (
                      <BookCard
                        key={entry.work._id || index}
                        work={entry.work}
                        large={shelf.kind === 'currentlyReading'}
                      />
                    ) : null,
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState title="Nothing here yet" body="Add a book from its page. Your shelves stay private." />
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    )
  } catch {
    return (
      <EmptyState
        title="Sign in to open your shelves"
        body="My Books is private. Clerk authentication and a server Sanity write token are required to persist ratings and shelves."
      />
    )
  }
}
