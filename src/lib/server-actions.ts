'use server'

import {castVote, createDiscussionPost, joinClub, setRating, setReadingStatus, setSpaceColor} from './actions'

export async function saveRatingAction(workId: string, value: number | null) {
  await setRating(workId, value)
}

export async function saveStatusAction(workId: string, status: string | null) {
  await setReadingStatus(workId, status)
}

export async function joinClubAction(clubId: string) {
  await joinClub(clubId)
}

export async function voteAction(pollId: string, workId: string) {
  await castVote(pollId, workId)
}

export async function postDiscussionAction(threadId: string, body: string, hasSpoilers: boolean) {
  await createDiscussionPost(threadId, body, hasSpoilers)
}

export async function saveSpaceColorAction(color: string) {
  await setSpaceColor(color)
}
