import {author} from './documents/author'
import {bestsellerSource} from './documents/bestsellerSource'
import {celebrityClub} from './documents/celebrityClub'
import {celebritySelection} from './documents/celebritySelection'
import {clubMembership} from './documents/clubMembership'
import {communityClub} from './documents/communityClub'
import {discussionPost} from './documents/discussionPost'
import {discussionThread} from './documents/discussionThread'
import {edition} from './documents/edition'
import {editorialCollection} from './documents/editorialCollection'
import {editorialReview} from './documents/editorialReview'
import {genre} from './documents/genre'
import {poll} from './documents/poll'
import {rating} from './documents/rating'
import {readerProfile} from './documents/readerProfile'
import {readingProgress} from './documents/readingProgress'
import {review} from './documents/review'
import {shelf} from './documents/shelf'
import {shelfEntry} from './documents/shelfEntry'
import {siteSettings} from './documents/siteSettings'
import {vote} from './documents/vote'
import {work} from './documents/work'
import {ratingStats} from './objects/ratingStats'
import {sourceProvenance} from './objects/sourceProvenance'

export const schemaTypes = [
  sourceProvenance,
  ratingStats,
  work,
  edition,
  author,
  genre,
  editorialCollection,
  bestsellerSource,
  celebrityClub,
  celebritySelection,
  editorialReview,
  siteSettings,
  readerProfile,
  rating,
  review,
  shelf,
  shelfEntry,
  readingProgress,
  communityClub,
  clubMembership,
  poll,
  vote,
  discussionThread,
  discussionPost,
]
