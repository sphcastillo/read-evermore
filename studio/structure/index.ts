import type {StructureResolver} from 'sanity/structure'
import {
  BookIcon,
  CalendarIcon,
  CheckmarkCircleIcon,
  CogIcon,
  DocumentIcon,
  LinkIcon,
  StarIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from '@sanity/icons'

const SINGLETONS = ['siteSettings']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Read Evermore')
    .items([
      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      S.listItem()
        .title('Catalog')
        .icon(BookIcon)
        .child(
          S.list()
            .title('Catalog')
            .items([
              S.documentTypeListItem('work').title('Works').icon(BookIcon),
              S.documentTypeListItem('edition').title('Editions'),
              S.documentTypeListItem('author').title('Authors').icon(UserIcon),
              S.documentTypeListItem('genre').title('Genres').icon(TagIcon),
            ]),
        ),
      S.listItem()
        .title('Releases')
        .icon(CalendarIcon)
        .child(
          S.documentTypeList('edition')
            .title('Editions with on-sale dates')
            .filter('_type == "edition" && defined(onSaleDate)'),
        ),
      S.listItem()
        .title('Collections')
        .icon(DocumentIcon)
        .child(S.documentTypeList('editorialCollection').title('Editorial collections')),
      S.listItem()
        .title('Celebrity clubs')
        .icon(StarIcon)
        .child(
          S.list()
            .title('Celebrity clubs')
            .items([
              S.documentTypeListItem('celebrityClub').title('Clubs'),
              S.documentTypeListItem('celebritySelection').title('Monthly selections'),
            ]),
        ),
      S.listItem()
        .title('Bestseller directory')
        .icon(LinkIcon)
        .child(S.documentTypeList('bestsellerSource').title('Official sources')),
      S.listItem()
        .title('Review inbox')
        .icon(CheckmarkCircleIcon)
        .child(
          S.list()
            .title('Editorial reviews')
            .items([
              S.listItem()
                .title('Needs review')
                .child(
                  S.documentList()
                    .title('Needs review')
                    .filter('_type == "editorialReview" && status == "needsReview"'),
                ),
              S.listItem()
                .title('Proposed')
                .child(
                  S.documentList()
                    .title('Proposed')
                    .filter('_type == "editorialReview" && status == "proposed"'),
                ),
              S.documentTypeListItem('editorialReview').title('All review tasks'),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Community (private)')
        .icon(UsersIcon)
        .child(
          S.list()
            .title('Reader data — handle with care')
            .items([
              S.documentTypeListItem('communityClub').title('Community clubs'),
              S.documentTypeListItem('clubMembership').title('Memberships'),
              S.documentTypeListItem('poll').title('Polls'),
              S.documentTypeListItem('discussionThread').title('Threads'),
              S.documentTypeListItem('readerProfile').title('Reader profiles'),
            ]),
        ),
      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId()
        return (
          !!id &&
          !SINGLETONS.includes(id) &&
          ![
            'work',
            'edition',
            'author',
            'genre',
            'editorialCollection',
            'bestsellerSource',
            'celebrityClub',
            'celebritySelection',
            'editorialReview',
            'communityClub',
            'clubMembership',
            'poll',
            'discussionThread',
            'readerProfile',
            'rating',
            'review',
            'shelf',
            'shelfEntry',
            'readingProgress',
            'vote',
            'discussionPost',
            'sourceProvenance',
            'ratingStats',
          ].includes(id)
        )
      }),
    ])
