import {createHash} from 'node:crypto'
import type {SanityClient} from '@sanity/client'
import type {GoodreadsBook} from './goodreads-csv'
import {slugify, stableId} from './validation'
import {ensureImportEdition} from './import-edition'
import {isbn13For, type EditionInput, type EditionMetadata} from './edition-metadata'

const reference = (_ref: string) => ({_type: 'reference', _ref})
const isConflict = (error: unknown) => Boolean(error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 409)

export type ImportResult = {row: number; title: string; status: 'imported' | 'skipped' | 'failed'; message?: string}

async function resolveWork(client: SanityClient, book: GoodreadsBook) {
  const importKey = createHash('sha256').update(`${book.title.toLowerCase()}\n${book.author.toLowerCase()}`).digest('hex')
  const params = {importKey, goodreadsId: book.goodreadsId || '', isbn10: book.isbn10 || '', isbn13: book.isbn13 || (book.isbn10 ? isbn13For(book.isbn10) : ''), title: book.title.toLowerCase(), author: book.author.toLowerCase()}
  const query = `coalesce(
    *[_type == "edition" && !(_id in path("drafts.**")) && (($isbn13 != "" && isbn13 == $isbn13) || ($isbn10 != "" && isbn10 == $isbn10))][0].work->_id,
    *[_type == "work" && !(_id in path("drafts.**")) && (importKey == $importKey || (defined(goodreadsBookId) && goodreadsBookId == $goodreadsId))][0]._id,
    *[_type == "work" && !(_id in path("drafts.**")) && lower(title) == $title && $author in authors[]->{"name": lower(name)}.name][0]._id
  )`
  const find = () => client.fetch<string | null>(query, params, {cache: 'no-store'})
  const existing = await find()
  if (existing) return existing

  let authorId = await client.fetch<string | null>(
    `*[_type == "author" && !(_id in path("drafts.**")) && lower(name) == $name][0]._id`,
    {name: book.author.toLowerCase()}, {cache: 'no-store'},
  )
  if (!authorId) {
    const author = await client.create({
      _type: 'author', name: book.author,
      slug: {_type: 'slug', current: `${slugify(book.author).slice(0, 70)}-${importKey.slice(0, 12)}`},
    }, {visibility: 'sync'})
    authorId = author._id
  }
  try {
    // Like the reader identity guard, this guard enforces uniqueness while Sanity
    // generates the actual work ID. Concurrent imports cannot create two works.
    await client.transaction()
      .create({_id: `catalogImportIdentity.${importKey}`, _type: 'catalogImportIdentity', importKey})
      .create({
        _type: 'work', title: book.title, importKey,
        ...(book.goodreadsId ? {goodreadsBookId: book.goodreadsId} : {}),
        slug: {_type: 'slug', current: `${slugify(book.title).slice(0, 70)}-${importKey.slice(0, 12)}`},
        authors: [{...reference(authorId), _key: 'author'}],
        ...(book.publicationYear ? {firstPublicationYear: book.publicationYear} : {}),
      })
      .commit({visibility: 'sync'})
  } catch (error) {
    if (!isConflict(error)) throw error
  }
  const workId = await find()
  if (!workId) throw new Error('Unable to resolve the imported book.')
  return workId
}

export async function importGoodreadsBook(client: SanityClient, readerId: string, book: GoodreadsBook, resolveMetadata?: (input: EditionInput) => Promise<EditionMetadata>): Promise<ImportResult> {
  const workId = await resolveWork(client, book)
  const editionId = resolveMetadata ? await ensureImportEdition(client, workId, book, resolveMetadata) : undefined
  const progressId = stableId(['progress', readerId, workId])
  const existing = await client.fetch<boolean>(
    `count(*[_type == "readingProgress" && reader._ref == $readerId && work._ref == $workId]) > 0 || count(*[_type == "shelfEntry" && work._ref == $workId && shelf->owner._ref == $readerId && shelf->kind in ["finished", "currentlyReading", "wantToRead"]]) > 0`,
    {readerId, workId}, {cache: 'no-store'},
  )
  if (existing) {
    if (editionId) {
      const entries = await client.fetch<{_id: string}[]>(
        `*[( _type == "readingProgress" && reader._ref == $readerId || _type == "shelfEntry" && shelf->owner._ref == $readerId) && work._ref == $workId && !defined(edition)]{_id}`,
        {readerId, workId}, {cache: 'no-store'},
      )
      for (const entry of entries) await client.patch(entry._id).setIfMissing({edition: reference(editionId)}).commit()
    }
    return {row: book.row, title: book.title, status: 'skipped', message: 'Already in your library; kept your existing shelf and dates.'}
  }
  const shelfId = stableId(['shelf', readerId, book.status])
  try {
    // Keep progress and shelf membership atomic, using the app's existing IDs.
    await client.transaction()
      .create({
        _id: progressId, _type: 'readingProgress', reader: reference(readerId), work: reference(workId),
        status: book.status, importSource: 'goodreads',
        ...(editionId ? {edition: reference(editionId)} : {}),
        ...(book.finishedAt ? {finishedAt: book.finishedAt} : {}),
        ...(book.readCount !== undefined ? {readCount: book.readCount} : {}),
      })
      .create({
        _id: stableId(['shelfEntry', shelfId, workId]), _type: 'shelfEntry',
        shelf: reference(shelfId), work: reference(workId),
        ...(editionId ? {edition: reference(editionId)} : {}),
        addedAt: book.addedAt ? `${book.addedAt}T00:00:00.000Z` : new Date().toISOString(),
      })
      .commit({visibility: 'sync'})
  } catch (error) {
    if (!isConflict(error)) throw error
    return {row: book.row, title: book.title, status: 'skipped', message: 'Already imported; kept your existing library entry.'}
  }
  return {row: book.row, title: book.title, status: 'imported'}
}
