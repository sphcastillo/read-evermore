import {defineField, defineType} from 'sanity'

export const ratingStats = defineType({
  name: 'ratingStats',
  title: 'Read Evermore rating stats',
  type: 'object',
  fields: [
    defineField({
      name: 'average',
      type: 'number',
      description: 'Mean of genuine Read Evermore half-star ratings. Not an imported community score.',
      readOnly: true,
    }),
    defineField({
      name: 'count',
      type: 'number',
      description: 'Number of current reader ratings included in the average.',
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      type: 'datetime',
      readOnly: true,
    }),
  ],
})
