'use server'

import {z} from 'zod'
import {revalidatePath} from 'next/cache'
import {requireReader} from './reader'
import {writeClient} from '@/sanity/client'
import {goodreadsBookSchema, IMPORT_BATCH_SIZE} from './goodreads-csv'
import {importGoodreadsBook, type ImportResult} from './goodreads-import'
import {resolveEditionMetadata} from './edition-metadata'

export async function importGoodreadsBatch(input: unknown): Promise<ImportResult[]> {
  const reader = await requireReader()
  const books = z.array(goodreadsBookSchema).min(1).max(IMPORT_BATCH_SIZE).parse(input)
  const client = writeClient()
  const results: ImportResult[] = []
  for (const book of books) {
    try {
      results.push(await importGoodreadsBook(client, reader.readerId, book, resolveEditionMetadata))
    } catch (error) {
      console.error('Goodreads book import failed:', error)
      results.push({row: book.row, title: book.title, status: 'failed', message: 'Could not save this book. You can retry this CSV safely.'})
    }
  }
  revalidatePath('/my-books')
  revalidatePath('/books/[slug]', 'page')
  return results
}
