import {projectId, dataset} from './env'
import createImageUrlBuilder from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url/lib/types/types'

const builder = createImageUrlBuilder({projectId, dataset})

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export function coverSrc(cover?: {
  coverUrl?: string | null
  coverOpenLibraryId?: string | null
  coverOverride?: {asset?: {_id?: string; url?: string}; alt?: string} | null
}) {
  if (cover?.coverOverride?.asset) {
    return urlFor(cover.coverOverride).width(400).height(600).fit('crop').url()
  }
  if (cover?.coverUrl) return cover.coverUrl
  if (cover?.coverOpenLibraryId) {
    const id = cover.coverOpenLibraryId.replace(/^\/?(books|works|authors)\//, '')
    return `https://covers.openlibrary.org/b/olid/${id}-L.jpg?default=false`
  }
  return null
}
