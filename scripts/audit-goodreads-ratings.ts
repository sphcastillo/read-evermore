/**
 * Check every Goodreads row against one reader's saved library.
 * node --import tsx scripts/audit-goodreads-ratings.ts <csv> <reader-id> [--apply]
 * --apply fills missing ratings only; existing nonzero ratings are preserved.
 */
import {config} from 'dotenv'
import {createClient} from '@sanity/client'
import {readFile, writeFile} from 'node:fs/promises'
import {parseGoodreadsCsv, type GoodreadsBook} from '../src/lib/goodreads-csv'
import {stableId} from '../src/lib/validation'

type SavedRating = {_id: string; _rev: string; value?: number | null}
type LibraryWork = {
  _id: string; title: string; goodreadsBookId?: string; authors?: string[]
  editions: {isbn10?: string; isbn13?: string}[]
  ratings: SavedRating[]
  progress: {status?: string; finishedAt?: string; readCount?: number}[]
  entries: {kind?: string; addedAt?: string}[]
}
const normalize = (text: string) => text.trim().toLowerCase()

function matchBook(book: GoodreadsBook, works: LibraryWork[]) {
  const bySource = works.filter((work) => book.goodreadsId && work.goodreadsBookId === book.goodreadsId)
  if (bySource.length) return bySource
  const byIsbn = works.filter((work) => work.editions.some((edition) =>
    Boolean(book.isbn13 && book.isbn13 === edition.isbn13 || book.isbn10 && book.isbn10 === edition.isbn10)))
  if (byIsbn.length) return byIsbn
  return works.filter((work) => normalize(work.title) === normalize(book.title) &&
    work.authors?.some((author) => normalize(author) === normalize(book.author)))
}

async function main() {
  config({path: ['.env.local', '.env'], quiet: true})
  const [csvPath, readerId, ...flags] = process.argv.slice(2)
  if (!csvPath || !readerId || flags.some((flag) => flag !== '--apply')) {
    throw new Error('Usage: <csv-path> <reader-id> [--apply]')
  }
  const apply = flags.includes('--apply')
  const token = apply ? process.env.SANITY_API_WRITE_TOKEN : process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error('Required Sanity token is not configured.')
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2026-09-01', useCdn: false, token, perspective: 'published',
  })
  const parsed = parseGoodreadsCsv(await readFile(csvPath, 'utf8'))
  if (parsed.issues.length || parsed.total !== parsed.books.length) throw new Error('CSV contains skipped rows; resolve them before auditing.')
  const query = /* groq */ `*[_type == "work" && !(_id in path("drafts.**")) && (
    count(*[_type == "readingProgress" && work._ref == ^._id && reader._ref == $readerId]) > 0 ||
    count(*[_type == "shelfEntry" && work._ref == ^._id && shelf->owner._ref == $readerId]) > 0
  )]{
    _id, title, goodreadsBookId, "authors": authors[]->name,
    "editions": *[_type == "edition" && work._ref == ^._id]{isbn10, isbn13},
    "ratings": *[_type == "rating" && reader._ref == $readerId && work._ref == ^._id] | order(_createdAt asc){_id, _rev, value},
    "progress": *[_type == "readingProgress" && reader._ref == $readerId && work._ref == ^._id]{status, finishedAt, readCount},
    "entries": *[_type == "shelfEntry" && work._ref == ^._id && shelf->owner._ref == $readerId]{"kind": shelf->kind, addedAt}
  }`
  const load = () => client.fetch<LibraryWork[]>(query, {readerId})
  function audit(works: LibraryWork[]) {
    return parsed.books.map((book) => {
      const matches = matchBook(book, works)
      const work = matches.length === 1 ? matches[0] : undefined
      const rating = work?.ratings[0]
      const expected = book.rating ?? null
      const saved = rating?.value ?? null
      const status = !work ? matches.length ? 'ambiguous-book' : 'missing-book'
        : work.ratings.length > 1 ? 'duplicate-ratings'
        : saved === expected ? 'matches'
        : saved === null && expected !== null ? 'missing-rating' : 'different-rating'
      return {
        row: book.row, title: book.title, goodreadsId: book.goodreadsId,
        workId: work?._id, expectedRating: expected, savedRating: saved, status,
        ratingDocument: rating || null,
        expectedShelf: book.status, savedShelves: work?.entries.map((entry) => entry.kind) || [],
        expectedDateRead: book.finishedAt || null, savedDateRead: work?.progress[0]?.finishedAt || null,
        expectedReadCount: book.readCount ?? null, savedReadCount: work?.progress[0]?.readCount ?? null,
      }
    })
  }
  const before = audit(await load())
  const summary = (rows: typeof before) => rows.reduce<Record<string, number>>((result, row) => {
    result[row.status] = (result[row.status] || 0) + 1
    return result
  }, {})
  const reportPath = '/tmp/everlogue-goodreads-rating-audit.json'
  await writeFile(reportPath, JSON.stringify({readerId, checkedAt: new Date().toISOString(), total: parsed.total, summary: summary(before), rows: before}, null, 2))
  console.log(JSON.stringify({phase: 'before', rows: parsed.total, summary: summary(before), reportPath}))
  const repairs = before.filter((row) => row.status === 'missing-rating')
  if (!apply || !repairs.length) return
  if (new Set(repairs.map((row) => row.workId)).size !== repairs.length) throw new Error('Multiple CSV rows target one work; review before applying.')
  await writeFile('/tmp/everlogue-goodreads-rating-audit.before.json', JSON.stringify({readerId, rows: before}, null, 2))
  const transaction = client.transaction()
  for (const row of repairs) {
    if (row.ratingDocument) {
      transaction.patch(row.ratingDocument._id, (patch) => patch.ifRevisionId(row.ratingDocument!._rev).set({value: row.expectedRating}))
    } else {
      transaction.create({
        _id: stableId(['rating', readerId, row.workId!]), _type: 'rating',
        reader: {_type: 'reference', _ref: readerId}, work: {_type: 'reference', _ref: row.workId!}, value: row.expectedRating,
      })
    }
  }
  await transaction.commit({visibility: 'sync'})
  const workIds = repairs.map((row) => row.workId!)
  const ratings = await client.fetch<{workId: string; value: number}[]>(
    `*[_type == "rating" && work._ref in $workIds && value > 0 && value <= 5]{"workId": work._ref, value}`,
    {workIds},
  )
  const aggregates = client.transaction()
  for (const workId of workIds) {
    const values = ratings.filter((rating) => rating.workId === workId).map((rating) => rating.value)
    aggregates.patch(workId, (patch) => patch.set({ratingStats: {
      _type: 'ratingStats', count: values.length,
      average: Math.round(values.reduce((total, value) => total + value, 0) / values.length * 100) / 100,
      updatedAt: new Date().toISOString(),
    }}))
  }
  await aggregates.commit({visibility: 'sync'})
  const after = audit(await load())
  await writeFile(reportPath, JSON.stringify({readerId, checkedAt: new Date().toISOString(), total: parsed.total, repaired: repairs.length, summary: summary(after), rows: after}, null, 2))
  console.log(JSON.stringify({phase: 'verified', repaired: repairs.length, summary: summary(after), reportPath,
    namedBook: after.find((row) => row.title.toLowerCase().includes('none of this is true'))}))
}

// Sanity request errors can contain authorization headers; never dump the object.
main().catch(() => {console.error('Audit failed. Review the local report; request details are omitted to protect credentials.'); process.exitCode = 1})
