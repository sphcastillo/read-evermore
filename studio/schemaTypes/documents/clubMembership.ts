import {defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons'

export const clubMembership = defineType({
  name: 'clubMembership',
  title: 'Club membership',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'club',
      type: 'reference',
      to: [{type: 'communityClub'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'reader',
      type: 'reference',
      to: [{type: 'readerProfile'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      type: 'string',
      initialValue: 'member',
      options: {
        list: [
          {title: 'Owner', value: 'owner'},
          {title: 'Moderator', value: 'moderator'},
          {title: 'Member', value: 'member'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      initialValue: 'active',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Left', value: 'left'},
          {title: 'Removed', value: 'removed'},
        ],
      },
    }),
  ],
})
