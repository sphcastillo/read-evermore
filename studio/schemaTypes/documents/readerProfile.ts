import {defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons'

export const readerProfile = defineType({
  name: 'readerProfile',
  title: 'Reader profile',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'clerkUserId',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'displayName',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'avatarUrl',
      type: 'url',
    }),
    defineField({
      name: 'bio',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'profileVisibility',
      type: 'string',
      initialValue: 'private',
      options: {
        list: [
          {title: 'Private', value: 'private'},
          {title: 'Public display name only', value: 'publicName'},
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: {title: 'displayName', subtitle: 'clerkUserId'},
  },
})
