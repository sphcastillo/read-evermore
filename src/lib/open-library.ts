import {z} from 'zod'

export const SEARCH_PAGE_SIZE = 20
export const MAX_SEARCH_PAGE = 100
export const searchInputSchema = z.object({
  q: z.string().trim().min(2).max(200),
  mode: z.enum(['all', 'title', 'author', 'isbn']).default('all'),
  sort: z.enum(['relevance', 'new', 'old']).default('relevance'),
  page: z.coerce.number().int().min(1).max(MAX_SEARCH_PAGE).default(1),
})
export type BookSearchInput = z.infer<typeof searchInputSchema>
export type SearchBook = {
  key: string
  title: string
  authors: string[]
  year?: number
  coverId?: number
  editionCount?: number
}
export type BookSearchResult = {books: SearchBook[]; total: number; exact: boolean}
export class BookSearchError extends Error {
  constructor(message: string, public readonly retryAfter = 0) {
    super(message)
    this.name = 'BookSearchError'
  }
}
const responseSchema = z.object({
  docs: z.array(z.unknown()),
  numFound: z.number().int().nonnegative(),
  numFoundExact: z.boolean().optional(),
})
const bookSchema = z.object({
  key: z.string().regex(/^\/works\/OL\d+W$/),
  title: z.string().min(1),
  author_name: z.array(z.string()).nullish(),
  first_publish_year: z.number().int().nullish(),
  cover_i: z.number().int().nullish(),
  edition_count: z.number().int().nonnegative().nullish(),
})

// A multi-instance deployment needs a shared limiter for an application-wide budget.
export function createBookSearch({fetcher = fetch, now = Date.now, contactEmail}: {
  fetcher?: typeof fetch
  now?: () => number
  contactEmail?: string
} = {}) {
  const cache = new Map<string, {expires: number; result: BookSearchResult}>()
  const pending = new Map<string, Promise<BookSearchResult>>()
  let nextRequestAt = 0

  async function request(input: BookSearchInput): Promise<BookSearchResult> {
    const params = new URLSearchParams({
      fields: 'key,title,author_name,first_publish_year,cover_i,edition_count',
      limit: String(SEARCH_PAGE_SIZE), page: String(input.page),
    })
    if (input.mode === 'isbn') {
      const isbn = input.q.replace(/[\s-]/g, '')
      if (!/^(?:\d{9}[\dXx]|\d{13})$/.test(isbn)) throw new BookSearchError('Enter a 10- or 13-digit ISBN.')
      params.set('isbn', isbn.toUpperCase())
    } else {
      params.set(input.mode === 'all' ? 'q' : input.mode, input.q)
    }
    if (input.sort !== 'relevance') params.set('sort', input.sort)
    if (now() < nextRequestAt) {
      throw new BookSearchError('Search is busy. Please wait a moment and try again.', Math.ceil((nextRequestAt - now()) / 1000))
    }
    // Use the conservative unidentified limit, including when contact is supplied.
    nextRequestAt = now() + 1000
    const email = contactEmail?.trim()
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': email ? `ReadEvermore/1.0 (${email})` : 'ReadEvermore/1.0',
    }
    if (email) headers.email = email
    let response: Response
    try {
      response = await fetcher(`https://openlibrary.org/search.json?${params}`, {
        headers, cache: 'no-store', signal: AbortSignal.timeout(10_000),
      })
    } catch {
      throw new BookSearchError('Open Library could not be reached. Please try again shortly.')
    }
    if (response.status === 429) {
      const value = response.headers.get('retry-after')
      const seconds = value && /^\d+$/.test(value) ? Number(value) : value ? (Date.parse(value) - now()) / 1000 : 60
      const retryAfter = Number.isFinite(seconds) ? Math.max(1, Math.ceil(seconds)) : 60
      nextRequestAt = Math.max(nextRequestAt, now() + retryAfter * 1000)
      throw new BookSearchError('Open Library is receiving too many requests. Please try again later.', retryAfter)
    }
    if (!response.ok) throw new BookSearchError('Open Library search is temporarily unavailable. Please try again shortly.')
    const parsed = responseSchema.safeParse(await response.json().catch(() => null))
    if (!parsed.success) throw new BookSearchError('Open Library returned an unreadable response. Please try again shortly.')
    const books: SearchBook[] = []
    const seen = new Set<string>()
    for (const raw of parsed.data.docs) {
      const doc = bookSchema.safeParse(raw)
      if (!doc.success || seen.has(doc.data.key)) continue
      const book = doc.data
      seen.add(book.key)
      books.push({key: book.key, title: book.title, authors: book.author_name || [],
        year: book.first_publish_year ?? undefined, coverId: book.cover_i && book.cover_i > 0 ? book.cover_i : undefined,
        editionCount: book.edition_count ?? undefined})
    }
    return {books, total: parsed.data.numFound, exact: parsed.data.numFoundExact !== false}
  }

  return async (value: BookSearchInput): Promise<BookSearchResult> => {
    const input = searchInputSchema.parse(value)
    const key = JSON.stringify(input)
    const hit = cache.get(key)
    if (hit && hit.expires > now()) return hit.result
    if (hit) cache.delete(key)
    const existing = pending.get(key)
    if (existing) return existing
    const job = request(input)
    pending.set(key, job)
    try {
      const result = await job
      if (cache.size >= 100) cache.delete(cache.keys().next().value!)
      cache.set(key, {result, expires: now() + 60 * 60 * 1000})
      return result
    } finally {
      pending.delete(key)
    }
  }
}
