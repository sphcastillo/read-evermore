'use client'

import {useEffect} from 'react'
import type {GoogleBook} from '@/lib/google-books'

export function LogSelectedBook({book, source}: {book: GoogleBook; source: string}) {
  useEffect(() => {
    console.log(`[${source}] Selected book`, book)
  }, [book, source])
  return null
}
