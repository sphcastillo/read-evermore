import type {SanityClient} from '@sanity/client'
import {slugify, stableId} from './validation'

export type ReaderProfile = {
  _id: string
  clerkUserId: string
  displayName: string
  spaceColor?: string | null
}

export type ClerkIdentity = {
  id: string
  firstName: string | null
  username: string | null
  imageUrl: string
}

export const PROFILE_QUERY = `*[_type == "readerProfile" && clerkUserId == $clerkUserId && !(_id in path("drafts.**"))] | order(_createdAt asc)[0]{_id, clerkUserId, displayName, spaceColor}`

// An internal uniqueness guard, not the profile ID. Sanity generates profile IDs.
export const identityGuardId = (id: string) => `clerkIdentity.${id}`

export async function syncReaderProfile(client: SanityClient, user: ClerkIdentity) {
  const findProfile = () => client.fetch<ReaderProfile | null>(
    PROFILE_QUERY, {clerkUserId: user.id}, {cache: 'no-store'},
  )
  const fields = {
    displayName: user.firstName || user.username || 'Reader',
    avatarUrl: user.imageUrl,
  }
  let profile = await findProfile()
  if (!profile) {
    try {
      // The guard and generated profile commit together; competing creators fail
      // before adding a second profile. Synchronous visibility makes it queryable.
      await client.transaction()
        .create({_id: identityGuardId(user.id), _type: 'clerkIdentity', clerkUserId: user.id})
        .create({_type: 'readerProfile', clerkUserId: user.id, ...fields, profileVisibility: 'private'})
        .commit({visibility: 'sync'})
    } catch (error) {
      if (!(error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 409)) {
        throw error
      }
    }
    profile = await findProfile()
    if (!profile) throw new Error('Unable to resolve the Clerk reader profile.')
  }
  // Patch only identity fields; preserve shelves, preferences, bio and visibility.
  await client.patch(profile._id).set(fields).commit()
  await ensureSystemShelves(client, profile._id)
  return {...profile, ...fields}
}

export async function ensureSystemShelves(client: SanityClient, readerId: string) {
  const shelves = [
    {kind: 'wantToRead', name: 'Want to Read'},
    {kind: 'currentlyReading', name: 'Currently Reading'},
    {kind: 'finished', name: 'Finished'},
  ] as const
  await Promise.all(shelves.map((shelf) => client.createIfNotExists({
    _id: stableId(['shelf', readerId, shelf.kind]),
    _type: 'shelf',
    owner: {_type: 'reference', _ref: readerId},
    name: shelf.name,
    slug: {_type: 'slug', current: slugify(shelf.name)},
    kind: shelf.kind,
    visibility: 'private',
  })))
}
