/**
 * Adds club selection month/year to curated collection entries.
 *
 *   pnpm tsx scripts/patch-selection-dates.ts
 */

import {config} from 'dotenv'
import {createClient} from '@sanity/client'
import {
  GMA_SELECTION_DATES,
  monthName,
  OPRAH_SELECTION_DATES,
} from '../src/lib/club-selection-dates'

config({path: ['.env.local', '.env'], quiet: true})

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const TOKEN = process.env.SANITY_API_WRITE_TOKEN

if (!PROJECT_ID) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
if (!TOKEN) throw new Error('Missing SANITY_API_WRITE_TOKEN')

const sanity = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2026-09-01',
  token: TOKEN,
  useCdn: false,
})

const CLUBS = [
  {id: 'curatedCollection.gma-book-club', dates: GMA_SELECTION_DATES},
  {id: 'curatedCollection.oprahs-book-club', dates: OPRAH_SELECTION_DATES},
] as const

type CollectionEntry = {
  _key: string
  _type?: string
  selectionNumber?: number
  month?: string | number
  year?: number
  selectionDate?: string
  book?: {_type?: string; _ref?: string; _weak?: boolean}
  [key: string]: unknown
}

async function patchCollection(id: string, dates: Record<number, {month: number; year: number}>) {
  const doc = await sanity.fetch<{_id: string; books?: CollectionEntry[]} | null>(
    `*[_id == $id][0]{_id, books}`,
    {id},
  )

  if (!doc?.books?.length) {
    console.log(`Skipped ${id}: no books`)
    return
  }

  let updated = 0
  const books = doc.books.map((entry) => {
    const selected = entry.selectionNumber ? dates[entry.selectionNumber] : undefined
    if (!selected) return entry
    updated += 1
    return {
      ...entry,
      month: monthName(selected.month),
      year: selected.year,
    }
  })

  await sanity.patch(id).set({books, lastSyncedAt: new Date().toISOString()}).commit()
  console.log(`✓ ${id}: wrote month/year on ${updated}/${doc.books.length} entries`)
}

async function main() {
  for (const club of CLUBS) {
    await patchCollection(club.id, club.dates)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
