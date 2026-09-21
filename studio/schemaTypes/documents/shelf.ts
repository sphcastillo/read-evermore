import {defineField, defineType} from 'sanity'
import {DocumentIcon} from '@sanity/icons'

export const shelf = defineType({
  name: 'shelf',
  title: 'Shelf',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'owner',
      type: 'reference',
      to: [{type: 'readerProfile'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      type: 'string',
      initialValue: 'custom',
      options: {
        list: [
          {title: 'Want to Read', value: 'wantToRead'},
          {title: 'Currently Reading', value: 'currentlyReading'},
          {title: 'Finished', value: 'finished'},
          {title: 'Custom', value: 'custom'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'visibility',
      type: 'string',
      initialValue: 'private',
      options: {
        list: [
          {title: 'Private', value: 'private'},
          {title: 'Public', value: 'public'},
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: {title: 'name', kind: 'kind'},
  },
})
