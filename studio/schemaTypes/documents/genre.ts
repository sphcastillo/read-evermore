import {defineField, defineType} from 'sanity'
import {TagIcon} from '@sanity/icons'

export const genre = defineType({
  name: 'genre',
  title: 'Genre',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'genre'}],
      description: 'Set for subgenres. Leave empty for top-level genres.',
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {title: 'title', parent: 'parent.title'},
    prepare({title, parent}) {
      return {
        title,
        subtitle: parent ? `Subgenre of ${parent}` : 'Genre',
      }
    },
  },
})
