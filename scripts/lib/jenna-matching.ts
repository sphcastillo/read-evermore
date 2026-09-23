import type {GoogleBook, GoogleSearchResponse} from '../../src/lib/google-books'
import type {JennaPick} from './jenna-source'

export function canonicalJennaTitle(title: string) {
  return title
    .replace(/\s*[:(–—-]?\s*a read with jenna(?: book club)? pick\)?\s*$/i, '')
    .replace(/:\s*a novel\s*$/i, '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
}

export async function searchJennaBooks(
  pick: JennaPick,
  score: (book: GoogleBook) => number,
  options: {key?: string; fetcher?: typeof fetch} = {},
) {
  const author = pick.authors[0] || ''
  const title = pick.title.replace(/"/g, '')
  const queries = [...new Set([
    pick.isbn ? `isbn:${pick.isbn}` : '',
    `intitle:"${title}"${author ? ` inauthor:"${author}"` : ''}`,
    `${title} ${author}`.trim(),
    `intitle:${title}${author ? ` inauthor:${author}` : ''}`,
  ].filter(Boolean))]
  const candidates = new Map<string, GoogleBook>()
  for (const query of queries) {
    const params = new URLSearchParams({q: query, maxResults: '40', printType: 'books'})
    const response = await (options.fetcher || fetch)(`https://www.googleapis.com/books/v1/volumes?${params}`, {
      headers: options.key ? {'x-goog-api-key': options.key} : {}, signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(`Google Books request failed (${response.status}).`)
    const data = await response.json() as GoogleSearchResponse
    for (const book of data.items || []) candidates.set(book.id, book)
    if ([...candidates.values()].some((book) => score(book) >= 80)) break
  }
  return [...candidates.values()]
}
