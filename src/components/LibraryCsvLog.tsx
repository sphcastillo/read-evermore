'use client'

import {useEffect} from 'react'

export function LibraryCsvLog({data}: {data: unknown}) {
  useEffect(() => {
    console.log('[Goodreads CSV]', data)
  }, [data])
  return null
}
