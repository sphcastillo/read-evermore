import {projectId, dataset} from './env'
import createImageUrlBuilder from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url/lib/types/types'
import {coverCandidates, type CoverSource} from '@/lib/book-covers'

const builder = createImageUrlBuilder({projectId, dataset})

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export function coverUrls(cover?: CoverSource | null) {
  const asset = cover?.coverOverride?.asset
  let manualUrl = asset?.url
  if (asset?._id || asset?._ref) {
    manualUrl = urlFor(cover!.coverOverride!).width(400).height(600).fit('crop').url()
  }
  return coverCandidates(cover, manualUrl)
}

export function coverSrc(cover?: CoverSource) {
  return coverUrls(cover)[0] || null
}
