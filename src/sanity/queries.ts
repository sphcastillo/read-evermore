import {defineQuery} from 'next-sanity'

export const editionCoverFields = /* groq */ `
  _id, isbn10, isbn13, cover, coverUrl, coverOpenLibraryId, needsCover,
  coverOverride{asset->{_id, url}, alt, hotspot, crop}
`

export const workCardFields = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  firstPublicationYear,
  description,
  ratingStats,
  "authors": authors[]->{ _id, name, "slug": slug.current },
  "genres": genres[]->{ _id, title, "slug": slug.current, "parentSlug": parent->slug.current },
  "cover": coalesce((^.featuredEditions[]->)[work._ref == ^._id][0]{${editionCoverFields}}, *[_type == "edition" && work._ref == ^._id] | order(defined(coverOverride.asset) desc, defined(cover.url) desc, defined(coverUrl) desc, onSaleDate desc, firstPublicationOfWork desc)[0]{
    ${editionCoverFields},
    isReprint,
    firstPublicationOfWork,
    onSaleDate,
    market
  })
`

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    tagline,
    catalogDisclaimer,
    ratingMethod,
    minimumRatingCount,
    openLibraryAttribution
  }
`)

export const DISCOVER_COLLECTIONS_QUERY = defineQuery(`
  *[_type == "editorialCollection" && workflowStatus == "approved" && kind == "discover"] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    description,
    "works": works[]->{ ${workCardFields} }
  }
`)

export const curatedBookFields = /* groq */ `
  _id,
  title,
  authors,
  "slug": slug.current,
  googleBooksId,
  publishedDate,
  isbn10, isbn13, coverOverride{asset->{_id, url}, alt, hotspot, crop},
  "edition": edition->{${editionCoverFields}},
  cover
`

export const CURATED_COLLECTIONS_QUERY = defineQuery(`
  *[_type == "curatedCollection"] | order(lastSyncedAt desc){
    _id,
    title,
    "slug": slug.current,
    collectionType,
    description,
    curator,
    source,
    totalSelections,
    "books": books | order(selectionNumber desc)[0...24]{
      selectionNumber,
      month,
      year,
      selectionDate,
      "book": book->{ ${curatedBookFields} }
    }
  }
`)

export const CURATED_COLLECTION_BY_SLUG_QUERY = defineQuery(`
  *[_type == "curatedCollection" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    collectionType,
    description,
    curator,
    source,
    totalSelections,
    "books": books | order(selectionNumber desc){
      selectionNumber,
      month,
      year,
      selectionDate,
      "book": book->{ ${curatedBookFields} }
    }
  }
`)

export const COLLECTION_BY_SLUG_QUERY = defineQuery(`
  *[_type == "editorialCollection" && slug.current == $slug && workflowStatus == "approved"][0]{
    _id,
    title,
    "slug": slug.current,
    description,
    editorialLabel,
    kind,
    "works": works[]->{ ${workCardFields} }
  }
`)

export const WORK_BY_SLUG_QUERY = defineQuery(`
  *[_type == "work" && slug.current == $slug][0]{
    ${workCardFields},
    subtitle,
    firstPublicationDate,
    openLibraryWorkKey,
    provenance,
    "editions": *[_type == "edition" && work._ref == ^._id] | order(onSaleDate desc){
      _id,
      title,
      isbn13,
      format,
      market,
      publisher,
      onSaleDate,
      isReprint,
      firstPublicationOfWork,
      ${editionCoverFields}
    }
  }
`)

export const GENRES_QUERY = defineQuery(`
  *[_type == "genre"] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    description,
    "parent": parent->{ title, "slug": slug.current }
  }
`)

export const BESTSELLER_SOURCES_QUERY = defineQuery(`
  *[_type == "bestsellerSource"] | order(name asc){
    _id,
    name,
    officialUrl,
    lastVerifiedAt,
    notes
  }
`)

export const CELEBRITY_CLUBS_QUERY = defineQuery(`
  *[_type == "celebrityClub"] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    officialUrl,
    disclaimer,
    "selections": *[_type == "celebritySelection" && club._ref == ^._id && workflowStatus == "approved"] | order(year desc, month desc){
      _id,
      year,
      month,
      sourceUrl,
      verifiedAt,
      emptyReason,
      "works": works[]->{ ${workCardFields} }
    }
  }
`)

export const CELEBRITY_CLUB_BY_SLUG_QUERY = defineQuery(`
  *[_type == "celebrityClub" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    officialUrl,
    disclaimer,
    "selections": *[_type == "celebritySelection" && club._ref == ^._id && workflowStatus == "approved"] | order(year desc, month desc){
      _id,
      year,
      month,
      sourceUrl,
      verifiedAt,
      emptyReason,
      "works": works[]->{ ${workCardFields} }
    }
  }
`)

export const COMMUNITY_CLUBS_QUERY = defineQuery(`
  *[_type == "communityClub" && visibility == "public"] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    description,
    isDemoClub,
    "currentRead": currentRead->{ ${workCardFields} }
  }
`)

export const COMMUNITY_CLUB_BY_SLUG_QUERY = defineQuery(`
  *[_type == "communityClub" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    description,
    visibility,
    isDemoClub,
    "currentRead": currentRead->{ ${workCardFields} }
  }
`)
