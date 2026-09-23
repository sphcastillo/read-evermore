import assert from 'node:assert/strict'
import {test} from 'node:test'
import {coverCandidates, openLibraryCover} from '../src/lib/book-covers'
import {isbn13For, matchGoogleEdition, resolveEditionMetadata} from '../src/lib/edition-metadata'

const input = {title: 'A Book', author: 'An Author', isbn13: '9780306406157'}
const volume = {id: 'google-id', volumeInfo: {title: 'A Book', authors: ['An Author'], publisher: 'Publisher', industryIdentifiers: [{type: 'ISBN_13', identifier: input.isbn13}], imageLinks: {thumbnail: 'http://books.google.com/cover.jpg'}}}

test('manual override precedes provider URLs and ISBN fallback; numeric cover IDs use the correct endpoint', () => {
  assert.deepEqual(coverCandidates({cover: {url: 'https://books.google.com/cover.jpg'}, coverOverride: {asset: {url: 'https://cdn.sanity.io/manual.jpg'}}, isbn13: input.isbn13}), ['https://cdn.sanity.io/manual.jpg', 'https://books.google.com/cover.jpg', openLibraryCover(input.isbn13)])
  assert.equal(coverCandidates({coverOpenLibraryId: '1234'})[0], 'https://covers.openlibrary.org/b/id/1234-L.jpg?default=false')
  assert.deepEqual(coverCandidates({cover: {url: 'same'}, coverUrl: 'same'}), ['same'])
})

test('matches exact ISBNs and refuses ambiguous or incorrect editions', () => {
  assert.equal(isbn13For('0306406152'), input.isbn13)
  assert.equal(matchGoogleEdition(input, [volume]), volume)
  assert.equal(matchGoogleEdition({...input, isbn13: '9780000000000'}, [volume]), undefined)
  assert.equal(matchGoogleEdition({title: input.title, author: input.author}, [volume, {...volume, id: 'another-edition'}]), volume)
})

test('uses a verified Google cover without requesting Open Library', async () => {
  const urls: string[] = []
  const fetcher = (async (url: string) => {
    urls.push(url)
    return url.includes('googleapis') ? Response.json({items: [volume]}) : new Response(null, {headers: {'content-type': 'image/jpeg'}})
  }) as typeof fetch
  const result = await resolveEditionMetadata(input, {fetcher, googleKey: 'test', pace: async () => {}})
  assert.equal(result.cover?.source, 'google')
  assert.equal(result.publisher, 'Publisher')
  assert.equal(result.needsCover, false)
  assert.equal(urls.length, 2)
})

test('falls back to Open Library on Google errors and marks missing covers for review', async () => {
  let found = true
  const fetcher = (async (url: string) => {
    if (url.includes('googleapis')) throw new Error('Unavailable')
    return new Response(null, {status: found ? 200 : 404, headers: {'content-type': 'image/jpeg'}})
  }) as typeof fetch
  const options = {fetcher, googleKey: 'test', pace: async () => {}}
  assert.equal((await resolveEditionMetadata(input, options)).cover?.source, 'openLibrary')
  found = false
  const missing = await resolveEditionMetadata(input, options)
  assert.equal(missing.needsCover, true)
  assert.equal(missing.cover, undefined)
})

test('does not borrow metadata or covers from a different ISBN', async () => {
  const urls: string[] = []
  const fetcher = (async (url: string) => {
    urls.push(url)
    return url.includes('googleapis') ? Response.json({items: [volume]}) : new Response(null, {status: 404})
  }) as typeof fetch
  const result = await resolveEditionMetadata({...input, isbn13: '9780000000000'}, {fetcher, googleKey: 'test', pace: async () => {}})
  assert.equal(result.googleBooksId, undefined)
  assert.ok(!urls.includes('https://books.google.com/cover.jpg'))
  assert.equal(result.needsCover, true)
})
