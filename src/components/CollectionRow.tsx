import Link from 'next/link'
import {BookCard, type WorkCardData} from './BookCard'

export function CollectionRow({
  title,
  href,
  description,
  works,
}: {
  title: string
  href: string
  description?: string | null
  works: WorkCardData[]
}) {
  return (
    <section className="mb-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[2rem] tracking-[-0.03em]">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-[var(--muted)]">{description}</p> : null}
        </div>
        <Link href={href} className="pill px-4 py-2 text-sm">
          See all
        </Link>
      </div>
      <div className="shelf-scroll -mx-1 px-1">
        {works.slice(0, 12).map((work) => (
          <BookCard key={work._id} work={work} />
        ))}
      </div>
    </section>
  )
}
