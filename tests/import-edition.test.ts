import assert from 'node:assert/strict'
import {test} from 'node:test'
import type {SanityClient} from '@sanity/client'
import {ensureImportEdition} from '../src/lib/import-edition'

test('reuses an ISBN edition on concurrent imports and keeps distinct editions of one work', async () => {
  type Doc = {_id: string; _type: string; importKey?: string; isbn13?: string; work?: {_ref: string}}
  const docs = new Map<string, Doc>()
  let sequence = 0, lookups = 0
  const client = {
    async fetch(_query: string, params: {importKey: string; isbn: string}) {
      const doc = [...docs.values()].find((doc) => doc._type === 'edition' && (doc.importKey === params.importKey || doc.isbn13 === params.isbn))
      return doc ? {...doc, workId: doc.work?._ref} : null
    },
    transaction() {
      const pending: Doc[] = []
      const tx = {
        create(doc: Doc) { pending.push({...doc, _id: doc._id || `generated-${++sequence}`}); return tx },
        async commit() {
          if (pending.some((doc) => docs.has(doc._id))) throw Object.assign(new Error('Conflict'), {statusCode: 409})
          for (const doc of pending) docs.set(doc._id, doc)
        },
      }
      return tx
    },
  } as unknown as SanityClient
  const resolve = async (input: {isbn13?: string}) => { lookups++; return {isbn13: input.isbn13, needsCover: true} }
  const book = {title: 'Book', author: 'Author', isbn13: '9780306406157'}
  const [a, b] = await Promise.all([ensureImportEdition(client, 'work', book, resolve), ensureImportEdition(client, 'work', book, resolve)])
  assert.equal(a, b)
  const previous = lookups
  // Existing records have already been checked; no network lookup on a repeat upload.
  assert.equal(await ensureImportEdition(client, 'work', book, resolve), a)
  assert.equal(lookups, previous)
  const other = await ensureImportEdition(client, 'work', {...book, isbn13: '9780000000000'}, resolve)
  assert.notEqual(a, other)
  assert.equal(await ensureImportEdition(client, 'different-work', book, resolve), undefined)
})
