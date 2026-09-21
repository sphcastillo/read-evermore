import assert from 'node:assert/strict'
import {test} from 'node:test'
import {BookSearchError, createBookSearch, searchInputSchema} from '../src/lib/open-library'

const input = (overrides = {}) => searchInputSchema.parse({q: 'The Hobbit', ...overrides})
const payload = {
  numFound: 1, numFoundExact: true,
  docs: [{key: '/works/OL27482W', title: 'The Hobbit', author_name: ['J.R.R. Tolkien'], first_publish_year: 1937, cover_i: 14627509}],
}

test('requests one bounded search page with explicit fields and contact identification', async () => {
  const search = createBookSearch({contactEmail: 'reader@example.org', fetcher: async (url, options) => {
    const parsed = new URL(String(url))
    assert.equal(parsed.origin, 'https://openlibrary.org')
    assert.equal(parsed.pathname, '/search.json')
    assert.equal(parsed.searchParams.get('author'), 'Ursula K. Le Guin')
    assert.equal(parsed.searchParams.get('sort'), 'new')
    assert.equal(parsed.searchParams.get('page'), '2')
    assert.equal(parsed.searchParams.get('limit'), '20')
    assert.equal(parsed.searchParams.get('fields')?.includes('*'), false)
    assert.match(new Headers(options?.headers).get('User-Agent')!, /reader@example.org/)
    return Response.json(payload)
  }})
  const result = await search(input({q: 'Ursula K. Le Guin', mode: 'author', sort: 'new', page: 2}))
  assert.equal(result.books[0].year, 1937)
  assert.equal(result.books[0].authors[0], 'J.R.R. Tolkien')
})

test('deduplicates concurrent searches, caches successes, and expires after an hour', async () => {
  let time = 1000
  let calls = 0
  const search = createBookSearch({now: () => time, fetcher: async () => { calls++; return Response.json(payload) }})
  await Promise.all([search(input()), search(input())])
  await search(input({q: '  The Hobbit  '}))
  assert.equal(calls, 1)
  time += 3_600_001
  await search(input())
  assert.equal(calls, 2)
})

test('limits distinct requests but permits cache hits during cooldown', async () => {
  let time = 1000
  let calls = 0
  const search = createBookSearch({now: () => time, fetcher: async () => { calls++; return Response.json(payload) }})
  await search(input())
  await assert.rejects(search(input({page: 2})), (error: unknown) => error instanceof BookSearchError && error.retryAfter === 1)
  await search(input())
  assert.equal(calls, 1)
  time += 1000
  await search(input({page: 2}))
  assert.equal(calls, 2)
})

test('honors upstream Retry-After and does not cache failed requests', async () => {
  let time = 1000
  let calls = 0
  const search = createBookSearch({now: () => time, fetcher: async () => {
    calls++
    return calls === 1 ? new Response(null, {status: 429, headers: {'Retry-After': '30'}}) : Response.json(payload)
  }})
  await assert.rejects(search(input()), (error: unknown) => error instanceof BookSearchError && error.retryAfter === 30)
  time += 2000
  await assert.rejects(search(input()))
  assert.equal(calls, 1)
  time += 28_000
  assert.equal((await search(input())).books.length, 1)
  assert.equal(calls, 2)
})

test('normalizes ISBNs and rejects invalid input without a network request', async () => {
  let calls = 0
  const search = createBookSearch({fetcher: async (url) => {
    calls++
    assert.equal(new URL(String(url)).searchParams.get('isbn'), '9780547928227')
    return Response.json(payload)
  }})
  await assert.rejects(search(input({q: 'bad isbn', mode: 'isbn'})))
  for (const value of [{q: ' '}, {q: 'a'.repeat(201)}, {page: -1}, {page: 1.5}, {page: 101}]) {
    assert.equal(searchInputSchema.safeParse({q: 'Hobbit', ...value}).success, false)
  }
  assert.equal(calls, 0)
  await search(input({q: '978-0-547-92822-7', mode: 'isbn'}))
  assert.equal(calls, 1)
})

test('handles missing metadata and excludes malformed and duplicate works', async () => {
  const search = createBookSearch({fetcher: async () => Response.json({numFound: 4, docs: [
    {key: '/works/OL1W', title: 'Minimal record', cover_i: -1},
    {key: '/works/OL1W', title: 'Duplicate'},
    {key: 'https://untrusted.example', title: 'Invalid key'}, {},
  ]})})
  const result = await search(input())
  assert.equal(result.books.length, 1)
  assert.deepEqual(result.books[0].authors, [])
  assert.equal(result.books[0].coverId, undefined)
})

test('distinguishes empty results from network, HTTP, and malformed-response failures', async () => {
  const empty = createBookSearch({fetcher: async () => Response.json({numFound: 0, docs: []})})
  assert.deepEqual((await empty(input())).books, [])
  for (const fetcher of [
    async () => {throw new Error('Network failure')},
    async () => new Response(null, {status: 503}),
    async () => Response.json({unexpected: true}),
    async () => new Response('not JSON'),
  ]) {
    await assert.rejects(createBookSearch({fetcher})(input()), BookSearchError)
  }
})
