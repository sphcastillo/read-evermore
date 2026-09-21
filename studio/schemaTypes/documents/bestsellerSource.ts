import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons'

export const bestsellerSource = defineType({
  name: 'bestsellerSource',
  title: 'Bestseller source',
  type: 'document',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'officialUrl',
      type: 'url',
      validation: (rule) =>
        rule.required().uri({scheme: ['https']}).error('Use a verified https official list URL'),
    }),
    defineField({
      name: 'lastVerifiedAt',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'notes',
      type: 'text',
      rows: 3,
      description: 'Linking only. Do not scrape or republish rankings.',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'officialUrl'},
  },
})
