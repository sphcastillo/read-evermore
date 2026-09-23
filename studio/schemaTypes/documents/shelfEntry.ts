import {defineField, defineType} from 'sanity'
import {DocumentIcon} from '@sanity/icons'

export const shelfEntry = defineType({
  name: 'shelfEntry',
  title: 'Shelf entry',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({name: 'edition', type: 'reference', to: [{type: 'edition'}]}),
    defineField({
      name: 'shelf',
      type: 'reference',
      to: [{type: 'shelf'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'work',
      type: 'reference',
      to: [{type: 'work'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'addedAt',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {work: 'work.title', shelf: 'shelf.name'},
    prepare({work, shelf}) {
      return {title: work, subtitle: shelf}
    },
  },
})
