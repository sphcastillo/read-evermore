import 'server-only'
import {revalidatePath} from 'next/cache'
import {privateClient, writeClient} from '@/sanity/client'
import {getOptionalReader, requireReader} from './reader'
import {
  canTransition,
  ratingValueSchema,
  readingStatusSchema,
  spaceColorSchema,
  stableId,
  workflowStatusSchema,
} from './validation'

async function refreshRatingStats(workId: string) {
  const ratings = await privateClient.fetch<number[]>(
    `*[_type == "rating" && work._ref == $workId].value`,
    {workId},
    {cache: 'no-store'},
  )
  const count = ratings.length
  const average = count ? ratings.reduce((sum, value) => sum + value, 0) / count : 0
  await writeClient()
    .patch(workId)
    .set({
      ratingStats: {
        _type: 'ratingStats',
        average: count ? Math.round(average * 100) / 100 : 0,
        count,
        updatedAt: new Date().toISOString(),
      },
    })
    .commit()
}

export async function setRating(workId: string, value: number | null) {
  const reader = await requireReader()
  const client = writeClient()
  const id = stableId(['rating', reader.readerId, workId])

  if (value === null) {
    await client.delete(id).catch(() => undefined)
  } else {
    const parsed = ratingValueSchema.parse(value)
    await client.createOrReplace({
      _id: id,
      _type: 'rating',
      reader: {_type: 'reference', _ref: reader.readerId},
      work: {_type: 'reference', _ref: workId},
      value: parsed,
    })
  }

  await refreshRatingStats(workId)
  revalidatePath('/books')
  revalidatePath('/my-books')
}

export async function setReadingStatus(workId: string, status: string | null) {
  const reader = await requireReader()
  const client = writeClient()
  const progressId = stableId(['progress', reader.readerId, workId])
  const kinds = ['wantToRead', 'currentlyReading', 'finished'] as const

  const shelves = await privateClient.fetch<{_id: string; kind: string}[]>(
    `*[_type == "shelf" && owner._ref == $readerId && kind in $kinds]{_id, kind}`,
    {readerId: reader.readerId, kinds},
    {cache: 'no-store'},
  )

  for (const shelf of shelves) {
    const entryId = stableId(['shelfEntry', shelf._id, workId])
    if (status && shelf.kind === status) {
      await client.createOrReplace({
        _id: entryId,
        _type: 'shelfEntry',
        shelf: {_type: 'reference', _ref: shelf._id},
        work: {_type: 'reference', _ref: workId},
        addedAt: new Date().toISOString(),
      })
    } else {
      await client.delete(entryId).catch(() => undefined)
    }
  }

  if (!status) {
    await client.delete(progressId).catch(() => undefined)
  } else {
    const parsed = readingStatusSchema.parse(status)
    await client.createOrReplace({
      _id: progressId,
      _type: 'readingProgress',
      reader: {_type: 'reference', _ref: reader.readerId},
      work: {_type: 'reference', _ref: workId},
      status: parsed,
      startedAt: parsed === 'currentlyReading' ? new Date().toISOString().slice(0, 10) : undefined,
      finishedAt: parsed === 'finished' ? new Date().toISOString().slice(0, 10) : undefined,
    })
  }

  revalidatePath('/my-books')
  revalidatePath('/books')
}

export async function getReaderBookState(workId: string) {
  const reader = await getOptionalReader()
  if (!reader) return {rating: null as number | null, status: null as string | null}

  const data = await privateClient.fetch<{
    rating?: number
    status?: string
  } | null>(
    `{
      "rating": *[_type == "rating" && reader._ref == $readerId && work._ref == $workId][0].value,
      "status": *[_type == "readingProgress" && reader._ref == $readerId && work._ref == $workId][0].status
    }`,
    {readerId: reader.readerId, workId},
    {cache: 'no-store'},
  )

  return {rating: data?.rating ?? null, status: data?.status ?? null}
}

export async function getMyBooks() {
  const reader = await requireReader()
  return privateClient.fetch(
    `{
      "shelves": *[_type == "shelf" && owner._ref == $readerId] | order(kind asc, name asc){
        _id,
        name,
        kind,
        "entries": *[_type == "shelfEntry" && shelf._ref == ^._id] | order(addedAt desc){
          _id,
          addedAt,
          "work": work->{
            _id,
            title,
            "slug": slug.current,
            firstPublicationYear,
            "authors": authors[]->{name},
            "cover": *[_type == "edition" && work._ref == ^._id] | order(firstPublicationOfWork desc)[0]{ coverUrl, coverOpenLibraryId }
          }
        }
      },
      "ratings": *[_type == "rating" && reader._ref == $readerId]{
        value,
        "workId": work._ref
      }
    }`,
    {readerId: reader.readerId},
    {cache: 'no-store'},
  )
}

export async function joinClub(clubId: string) {
  const reader = await requireReader()
  const club = await privateClient.fetch<{visibility?: string} | null>(
    `*[_type == "communityClub" && _id == $clubId][0]{visibility}`,
    {clubId},
    {cache: 'no-store'},
  )
  if (!club) throw new Error('Club not found')
  if (club.visibility === 'private') throw new Error('This club is private.')

  await writeClient().createIfNotExists({
    _id: stableId(['membership', clubId, reader.readerId]),
    _type: 'clubMembership',
    club: {_type: 'reference', _ref: clubId},
    reader: {_type: 'reference', _ref: reader.readerId},
    role: 'member',
    status: 'active',
  })
  revalidatePath('/clubs')
}

export async function castVote(pollId: string, workId: string) {
  const reader = await requireReader()
  const poll = await privateClient.fetch<{
    status?: string
    allowVoteChange?: boolean
    options?: {_ref: string}[]
    club?: {_ref: string}
  } | null>(
    `*[_type == "poll" && _id == $pollId][0]{status, allowVoteChange, options, club}`,
    {pollId},
    {cache: 'no-store'},
  )
  if (!poll || poll.status !== 'open') throw new Error('This poll is closed.')
  if (!poll.options?.some((option) => option._ref === workId)) {
    throw new Error('That book is not on this ballot.')
  }

  const membership = await privateClient.fetch<{_id?: string} | null>(
    `*[_type == "clubMembership" && club._ref == $clubId && reader._ref == $readerId && status == "active"][0]{_id}`,
    {clubId: poll.club?._ref, readerId: reader.readerId},
    {cache: 'no-store'},
  )
  if (!membership?._id) throw new Error('Join the club to vote.')

  const voteId = stableId(['vote', pollId, reader.readerId])
  const existing = await privateClient.fetch<{_id?: string} | null>(
    `*[_id == $voteId][0]{_id}`,
    {voteId},
    {cache: 'no-store'},
  )
  if (existing?._id && poll.allowVoteChange === false) {
    throw new Error('Votes cannot be changed on this poll.')
  }

  await writeClient().createOrReplace({
    _id: voteId,
    _type: 'vote',
    poll: {_type: 'reference', _ref: pollId},
    reader: {_type: 'reference', _ref: reader.readerId},
    option: {_type: 'reference', _ref: workId},
  })
  revalidatePath('/clubs')
}

export async function createDiscussionPost(threadId: string, body: string, hasSpoilers: boolean) {
  const reader = await requireReader()
  const thread = await privateClient.fetch<{club?: {_ref: string}} | null>(
    `*[_type == "discussionThread" && _id == $threadId][0]{club}`,
    {threadId},
    {cache: 'no-store'},
  )
  const membership = await privateClient.fetch<{role?: string} | null>(
    `*[_type == "clubMembership" && club._ref == $clubId && reader._ref == $readerId && status == "active"][0]{role}`,
    {clubId: thread?.club?._ref, readerId: reader.readerId},
    {cache: 'no-store'},
  )
  if (!membership) throw new Error('Join the club to post.')
  if (!body.trim()) throw new Error('Write a few words first.')

  await writeClient().create({
    _type: 'discussionPost',
    thread: {_type: 'reference', _ref: threadId},
    author: {_type: 'reference', _ref: reader.readerId},
    body: body.trim(),
    hasSpoilers,
    moderationStatus: 'visible',
    isDemoActivity: false,
  })
  revalidatePath('/clubs')
}

export async function moderatePost(postId: string, moderationStatus: 'visible' | 'hidden') {
  const reader = await requireReader()
  const post = await privateClient.fetch<{thread?: {_ref: string}} | null>(
    `*[_type == "discussionPost" && _id == $postId][0]{thread}`,
    {postId},
    {cache: 'no-store'},
  )
  const thread = await privateClient.fetch<{club?: {_ref: string}} | null>(
    `*[_type == "discussionThread" && _id == $threadId][0]{club}`,
    {threadId: post?.thread?._ref},
    {cache: 'no-store'},
  )
  const membership = await privateClient.fetch<{role?: string} | null>(
    `*[_type == "clubMembership" && club._ref == $clubId && reader._ref == $readerId && status == "active"][0]{role}`,
    {clubId: thread?.club?._ref, readerId: reader.readerId},
    {cache: 'no-store'},
  )
  if (!membership || !['owner', 'moderator'].includes(membership.role || '')) {
    throw new Error('Only moderators can hide posts.')
  }
  await writeClient().patch(postId).set({moderationStatus}).commit()
  revalidatePath('/clubs')
}

export async function transitionWorkflow(documentId: string, nextStatus: string, note?: string) {
  const parsed = workflowStatusSchema.parse(nextStatus)
  const doc = await privateClient.fetch<{
    _type?: string
    status?: string
    workflowStatus?: string
  } | null>(`*[_id == $documentId][0]{_type, status, workflowStatus}`, {documentId}, {cache: 'no-store'})
  if (!doc) throw new Error('Document not found')
  const current = doc.status || doc.workflowStatus || 'proposed'
  if (!canTransition(current, parsed)) {
    throw new Error(`Cannot move from ${current} to ${parsed}`)
  }
  const field = doc._type === 'editorialReview' ? 'status' : 'workflowStatus'
  const patch: Record<string, unknown> = {[field]: parsed}
  if (parsed === 'approved' || parsed === 'rejected') {
    patch.reviewedAt = new Date().toISOString()
    patch.reviewedBy = 'server-action'
    if (note) patch.note = note
  }
  await writeClient().patch(documentId).set(patch).commit()
  if (doc._type === 'celebritySelection' && field === 'workflowStatus') {
    const reviews = await privateClient.fetch<{_id: string}[]>(
      `*[_type == "editorialReview" && target._ref == $documentId]{_id}`,
      {documentId},
      {cache: 'no-store'},
    )
    await Promise.all(
      reviews.map((review) =>
        writeClient()
          .patch(review._id)
          .set({status: parsed, reviewedAt: patch.reviewedAt, reviewedBy: 'server-action'})
          .commit(),
      ),
    )
  }
  revalidatePath('/')
  revalidatePath('/picks')
  revalidatePath('/browse')
}

export async function getClubExperience(clubId: string) {
  const reader = await getOptionalReader()
  return privateClient.fetch(
    `{
      "membership": ${
        reader
          ? `*[_type == "clubMembership" && club._ref == $clubId && reader._ref == $readerId][0]{role, status}`
          : `null`
      },
      "poll": *[_type == "poll" && club._ref == $clubId] | order(_updatedAt desc)[0]{
        _id,
        title,
        status,
        allowVoteChange,
        "options": options[]->{ _id, title, "slug": slug.current, "authors": authors[]->{name} },
        "tallies": options[]{
          "_ref": _ref,
          "count": count(*[_type == "vote" && poll._ref == ^.^._id && option._ref == ^._ref])
        },
        "myVote": ${
          reader
            ? `*[_type == "vote" && poll._ref == ^._id && reader._ref == $readerId][0].option._ref`
            : `null`
        }
      },
      "thread": *[_type == "discussionThread" && club._ref == $clubId] | order(_updatedAt desc)[0]{
        _id,
        title,
        spoilerBoundary,
        isDemoThread,
        "posts": *[_type == "discussionPost" && thread._ref == ^._id && moderationStatus == "visible"] | order(_createdAt asc){
          _id,
          body,
          hasSpoilers,
          isDemoActivity,
          _createdAt,
          "authorName": author->displayName
        }
      }
    }`,
    {clubId, readerId: reader?.readerId || ''},
    {cache: 'no-store'},
  )
}

export async function setSpaceColor(color: string) {
  const reader = await requireReader()
  const parsed = spaceColorSchema.parse(color)
  await writeClient().patch(reader.readerId).set({spaceColor: parsed}).commit()
  revalidatePath('/', 'layout')
}
