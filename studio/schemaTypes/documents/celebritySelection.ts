import {defineArrayMember, defineField, defineType} from 'sanity'
import {CalendarIcon} from '@sanity/icons'

export const celebritySelection = defineType({
  name: 'celebritySelection',
  title: 'Celebrity club selection',
  type: 'document',
  icon: CalendarIcon,
  fields: [
    defineField({
      name: 'club',
      type: 'reference',
      to: [{type: 'celebrityClub'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'year',
      type: 'number',
      validation: (rule) => rule.required().min(1990).max(2100).integer(),
    }),
    defineField({
      name: 'month',
      type: 'number',
      validation: (rule) => rule.required().min(1).max(12).integer(),
    }),
    defineField({
      name: 'works',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'work'}]})],
      description: 'Leave empty when a month has no verified selection.',
    }),
    defineField({
      name: 'sourceUrl',
      type: 'url',
      validation: (rule) =>
        rule.custom((url, context) => {
          const works = (context.document as {works?: unknown[]} | undefined)?.works
          if (works && works.length > 0 && !url) {
            return 'A source URL is required when listing verified picks'
          }
          return true
        }),
    }),
    defineField({
      name: 'verifiedAt',
      type: 'datetime',
      validation: (rule) =>
        rule.custom((value, context) => {
          const works = (context.document as {works?: unknown[]} | undefined)?.works
          if (works && works.length > 0 && !value) {
            return 'Verification date is required when listing verified picks'
          }
          return true
        }),
    }),
    defineField({
      name: 'workflowStatus',
      type: 'string',
      initialValue: 'proposed',
      options: {
        list: [
          {title: 'Proposed', value: 'proposed'},
          {title: 'Needs review', value: 'needsReview'},
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'provenance',
      type: 'sourceProvenance',
    }),
    defineField({
      name: 'emptyReason',
      type: 'string',
      description: 'Shown when this month has no verified pick.',
    }),
  ],
  preview: {
    select: {
      club: 'club.name',
      year: 'year',
      month: 'month',
      status: 'workflowStatus',
    },
    prepare({club, year, month, status}) {
      return {
        title: `${club || 'Club'} — ${year}-${String(month).padStart(2, '0')}`,
        subtitle: status,
      }
    },
  },
})
