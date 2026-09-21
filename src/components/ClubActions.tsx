'use client'

import {useState, useTransition} from 'react'
import {joinClubAction, postDiscussionAction, voteAction} from '@/lib/server-actions'

type Poll = {
  _id: string
  status: string
  options?: {_id: string; title?: string; authors?: {name?: string}[]}[]
  tallies?: {_ref: string; count: number}[]
  myVote?: string | null
}

export function ClubActions({
  clubId,
  poll,
  threadId,
  signedIn,
  isMember,
}: {
  clubId: string
  poll?: Poll
  threadId?: string
  signedIn: boolean
  isMember: boolean
}) {
  const [pending, start] = useTransition()
  const [body, setBody] = useState('')
  const [spoilers, setSpoilers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!signedIn) {
    return <p className="mt-4 text-sm text-[var(--muted)]">Sign in to join, vote, and post.</p>
  }

  if (threadId && isMember) {
    return (
      <form
        className="mt-6 surface p-4"
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          start(async () => {
            try {
              await postDiscussionAction(threadId, body, spoilers)
              setBody('')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not post')
            }
          })
        }}
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="field"
          rows={4}
          placeholder="Write with care. Mark spoilers."
        />
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={spoilers} onChange={(event) => setSpoilers(event.target.checked)} />
          This post has spoilers
        </label>
        <button disabled={pending} className="pill is-active mt-3 px-4 py-2 text-sm">
          Post
        </button>
        {error ? <p className="mt-2 text-sm text-[var(--accent)]">{error}</p> : null}
      </form>
    )
  }

  if (poll && isMember) {
    return (
      <ul className="mt-4 space-y-2">
        {poll.options?.map((option) => {
          const count = poll.tallies?.find((item) => item._ref === option._id)?.count || 0
          return (
            <li key={option._id} className="flex items-center justify-between gap-3">
              <span>
                {option.title}{' '}
                <span className="text-sm text-[var(--muted)]">
                  {option.authors?.map((author) => author.name).join(', ')} · {count} votes
                </span>
              </span>
              <button
                disabled={pending || poll.status !== 'open'}
                onClick={() =>
                  start(async () => {
                    setError(null)
                    try {
                      await voteAction(poll._id, option._id)
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Vote failed')
                    }
                  })
                }
                className={`pill px-3 py-1 text-sm ${poll.myVote === option._id ? 'is-active' : ''}`}
              >
                {poll.myVote === option._id ? 'Your vote' : 'Vote'}
              </button>
            </li>
          )
        })}
        {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
      </ul>
    )
  }

  if (!isMember) {
    return (
      <button
        disabled={pending}
        className="pill is-active mt-4 px-4 py-2 text-sm"
        onClick={() =>
          start(async () => {
            setError(null)
            try {
              await joinClubAction(clubId)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not join')
            }
          })
        }
      >
        Join this club
      </button>
    )
  }

  return error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null
}
