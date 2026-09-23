import {auth} from '@clerk/nextjs/server'
import {NextRequest, NextResponse} from 'next/server'
import {GOOGLE_VOLUME_ID} from '@/lib/google-books'
import {fetchGoogleVolume} from '@/lib/google-books-api'

export async function GET(_request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  const {isAuthenticated} = await auth()
  if (!isAuthenticated) {
    return NextResponse.json({error: 'Sign in to view this book.'}, {status: 401})
  }

  const {id} = await params
  if (!GOOGLE_VOLUME_ID.test(id)) {
    return NextResponse.json({error: 'Book not found.'}, {status: 404})
  }

  try {
    const book = await fetchGoogleVolume(id)
    if (!book) return NextResponse.json({error: 'Book not found.'}, {status: 404})
    return NextResponse.json(book)
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number(error.status) : 502
    if (status === 502 || Number.isNaN(status)) {
      return NextResponse.json({error: 'Google Books could not be reached.'}, {status: 502})
    }
    return NextResponse.json({error: 'Google Books request failed'}, {status})
  }
}
