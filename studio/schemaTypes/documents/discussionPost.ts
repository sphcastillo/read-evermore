import {defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons'

export const discussionPost = defineType({
  name: 'discussionPost',
  title: 'Discussion post',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'thread',
      type: 'reference',
      to: [{type: 'discussionThread'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      type: 'reference',
      to: [{type: 'readerProfile'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      type: 'text',
      validation: (rule) => rule.required().max(4000),
    }),
    defineField({
      name: 'hasSpoilers',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'moderationStatus',
      type: 'string',
      initialValue: 'visible',
      options: {
        list: [
          {title: 'Visible', value: 'visible'},
          {title: 'Hidden', value: 'hidden'},
        ],
      },
    }),
    defineField({
      name: 'isDemoActivity',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
