import 'server-only'
import {auth, currentUser} from '@clerk/nextjs/server'
import {privateClient, writeClient} from '@/sanity/client'
import {slugify, stableId} from './validation'

export type ReaderSession = {
  readerId: string
  clerkUserId: string
  displayName: string
  spaceColor?: string | null
}

const PROFILE_QUERY = `*[_type == "readerProfile" && clerkUserId == $clerkUserId][0]{_id, displayName, clerkUserId, spaceColor}`

async function ensureSystemShelves(readerId: string) {
  const client = writeClient()
  const shelves = [
    {kind: 'wantToRead', name: 'Want to Read'},
    {kind: 'currentlyReading', name: 'Currently Reading'},
    {kind: 'finished', name: 'Finished'},
  ] as const

  await Promise.all(
    shelves.map((shelf) =>
      client.createIfNotExists({
        _id: stableId(['shelf', readerId, shelf.kind]),
        _type: 'shelf',
        owner: {_type: 'reference', _ref: readerId},
        name: shelf.name,
        slug: {_type: 'slug', current: slugify(shelf.name)},
        kind: shelf.kind,
        visibility: 'private',
      }),
    ),
  )
}

export async function getOptionalReader(): Promise<ReaderSession | null> {
  if (!process.env.CLERK_SECRET_KEY) return null
  try {
    const {userId} = await auth()
    if (!userId) return null
    return getOrCreateReader(userId)
  } catch {
    return null
  }
}

export async function requireReader(): Promise<ReaderSession> {
  const reader = await getOptionalReader()
  if (!reader) {
    throw new Error('Sign in to continue.')
  }
  return reader
}

async function getOrCreateReader(clerkUserId: string): Promise<ReaderSession> {
  const existing = await privateClient.fetch<{
    _id: string
    displayName?: string
    clerkUserId: string
    spaceColor?: string | null
  } | null>(PROFILE_QUERY, {clerkUserId}, {cache: 'no-store'})
  if (existing?._id) {
    return {
      readerId: existing._id,
      clerkUserId,
      displayName: existing.displayName || 'Reader',
      spaceColor: existing.spaceColor,
    }
  }

  const user = await currentUser()
  const displayName =
    user?.firstName || user?.username || user?.emailAddresses[0]?.emailAddress || 'Reader'
  const client = writeClient()
  const created = await client.create({
    _type: 'readerProfile',
    clerkUserId,
    displayName,
    avatarUrl: user?.imageUrl,
    profileVisibility: 'private',
  })
  await ensureSystemShelves(created._id)
  return {readerId: created._id, clerkUserId, displayName}
}

export function privateHeaders() {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
  }
}
