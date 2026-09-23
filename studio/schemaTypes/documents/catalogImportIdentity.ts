import {defineField, defineType} from 'sanity'

export const catalogImportIdentity = defineType({
  name: 'catalogImportIdentity',
  title: 'Catalog import identity',
  type: 'document',
  readOnly: true,
  fields: [defineField({name: 'importKey', type: 'string'})],
})
