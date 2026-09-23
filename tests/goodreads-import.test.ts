import assert from 'node:assert/strict'
import {test} from 'node:test'
import type {SanityClient} from '@sanity/client'
import {importGoodreadsBook} from '../src/lib/goodreads-import'
import type {GoodreadsBook} from '../src/lib/goodreads-csv'

type Doc = Record<string, unknown> & {_id: string}
const book: GoodreadsBook = {row: 2, title: 'A Book', author: 'An Author', status: 'finished', finishedAt: '2020-01-02', addedAt: '2019-06-01', readCount: 2}
const ref = (value: unknown) => (value as {_ref?: string} | undefined)?._ref

function database(initial: Doc[] = []) {
  const docs = new Map(initial.map((doc) => [doc._id, {...doc}]))
  let sequence = 0, fail = false
  const client = {
    async fetch(query: string, params: Record<string, string>) {
      const all = [...docs.values()]
      if (query.startsWith('coalesce')) return all.find((doc) => doc._type === 'work' && (doc.importKey === params.importKey || String(doc.title).toLowerCase() === params.title))?._id || null
      if (query.includes('_type == "author"')) return all.find((doc) => doc._type === 'author')?._id || null
      return all.some((doc) => doc._type === 'readingProgress' && ref(doc.reader) === params.readerId && ref(doc.work) === params.workId)
    },
    async create(doc: Record<string, unknown>) {
      const result = {...doc, _id: `generated-${++sequence}`}
      docs.set(result._id, result)
      return result
    },
    transaction() {
      const pending: Doc[] = []
      const tx = {
        create(doc: Record<string, unknown>) {
          pending.push({...doc, _id: String(doc._id || `generated-${++sequence}`)})
          return tx
        },
        async commit() {
          if (fail && pending.some((doc) => doc._type === 'shelfEntry')) throw new Error('Network failure')
          if (pending.some((doc) => docs.has(doc._id))) throw Object.assign(new Error('Conflict'), {statusCode: 409})
          for (const doc of pending) docs.set(doc._id, doc)
        },
      }
      return tx
    },
  } as unknown as SanityClient
  return {client, docs, setFailure: (value: boolean) => { fail = value }}
}

test('saves imported dates and correct shelf, preserving existing entries on reimport', async () => {
  const {client, docs} = database([{_id: 'existing-book', _type: 'work', title: book.title}])
  assert.equal((await importGoodreadsBook(client, 'reader-1', book)).status, 'imported')
  const progress = docs.get('progress-reader-1-existing-book')!
  assert.equal(progress.finishedAt, '2020-01-02')
  assert.equal(progress.readCount, 2)
  const entry = [...docs.values()].find((doc) => doc._type === 'shelfEntry')!
  assert.equal(ref(entry.shelf), 'shelf-reader-1-finished')
  assert.equal(entry.addedAt, '2019-06-01T00:00:00.000Z')
  assert.equal((await importGoodreadsBook(client, 'reader-1', {...book, status: 'wantToRead'})).status, 'skipped')
  assert.equal(progress.status, 'finished')
  assert.equal((await importGoodreadsBook(client, 'reader-2', book)).status, 'imported')
})

test('concurrent imports create one work and one library entry', async () => {
  const {client, docs} = database()
  const results = await Promise.all([importGoodreadsBook(client, 'reader', book), importGoodreadsBook(client, 'reader', book)])
  assert.equal(results.filter((result) => result.status === 'imported').length, 1)
  assert.equal([...docs.values()].filter((doc) => doc._type === 'work').length, 1)
  assert.equal([...docs.values()].filter((doc) => doc._type === 'shelfEntry').length, 1)
})

test('failed writes leave no partial reading progress and can be retried', async () => {
  const {client, docs, setFailure} = database()
  setFailure(true)
  await assert.rejects(importGoodreadsBook(client, 'reader', book), /Network failure/)
  assert.equal([...docs.values()].filter((doc) => doc._type === 'readingProgress').length, 0)
  setFailure(false)
  assert.equal((await importGoodreadsBook(client, 'reader', book)).status, 'imported')
  assert.equal([...docs.values()].filter((doc) => doc._type === 'work').length, 1)
})
