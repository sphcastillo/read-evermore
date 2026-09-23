import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '3h0o1unw',
    dataset: 'production',
  },
  deployment: {
    autoUpdates: true,
  },
  schemaExtraction: {
    enabled: true,
    enforceRequiredFields: true,
  },
  typegen: {
    enabled: true,
    path: '../src/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../src/sanity/types.ts',
    overloadClientMethods: true,
  },
})
