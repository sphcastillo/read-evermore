import {defineArrayMember, defineField, defineType} from 'sanity'
import {BookIcon} from '@sanity/icons'

function yearFromDate(value?: string) {
  if (!value) return undefined
  const year = Number(value.slice(0, 4))
  return Number.isFinite(year) ? year : undefined
}

export const work = defineType({
  name: 'work',
  title: 'Work',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      type: 'string',
    }),
    defineField({
      name: 'authors',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'author'}]})],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'genres',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'genre'}]})],
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'firstPublicationYear',
      type: 'number',
      description: 'Use this for Fantasy by Year. Do not invent a month or day when only the year is known.',
      validation: (rule) => rule.min(1000).max(2100).integer(),
    }),
    defineField({
      name: 'firstPublicationDate',
      type: 'date',
      description: 'Store a full date only when verified.',
      validation: (rule) =>
        rule.custom((date, context) => {
          const year = (context.document as {firstPublicationYear?: number} | undefined)
            ?.firstPublicationYear
          if (!date || !year) return true
          if (yearFromDate(date) !== year) {
            return 'firstPublicationDate year must match firstPublicationYear'
          }
          return true
        }),
    }),
    defineField({
      name: 'openLibraryWorkKey',
      type: 'string',
      description: 'Open Library work key, e.g. OL45883W',
    }),
    defineField({
      name: 'provenance',
      type: 'sourceProvenance',
    }),
    defineField({
      name: 'ratingStats',
      type: 'ratingStats',
      readOnly: true,
    }),
    defineField({
      name: 'editorialLocked',
      type: 'boolean',
      initialValue: false,
      description: 'When true, import scripts must not overwrite reviewed title, description, dates, or genre.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      year: 'firstPublicationYear',
      author0: 'authors.0.name',
    },
    prepare({title, year, author0}) {
      return {
        title: title || 'Untitled work',
        subtitle: [author0, year].filter(Boolean).join(' · '),
      }
    },
  },
})
