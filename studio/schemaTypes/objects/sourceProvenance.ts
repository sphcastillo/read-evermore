import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons'

export const sourceProvenance = defineType({
  name: 'sourceProvenance',
  title: 'Source provenance',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'provider',
      type: 'string',
      options: {
        list: [
          {title: 'Open Library', value: 'openLibrary'},
          {title: 'Google Books', value: 'googleBooks'},
          {title: 'Hardcover', value: 'hardcover'},
          {title: 'Editorial', value: 'editorial'},
          {title: 'Official site', value: 'officialSite'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'sourceId', type: 'string', title: 'Source identifier'}),
    defineField({
      name: 'sourceUrl',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({name: 'retrievedAt', type: 'datetime'}),
    defineField({name: 'attribution', type: 'string'}),
    defineField({name: 'licenseNote', type: 'text', rows: 2}),
  ],
  preview: {
    select: {title: 'provider', subtitle: 'sourceId'},
  },
})
