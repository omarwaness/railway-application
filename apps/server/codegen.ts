import type { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'

const endpoint = process.env.RAILWAY_ENDPOINT

if (!endpoint) throw new Error('RAILWAY_ENDPOINT is not set')

const config: CodegenConfig = {
   schema: endpoint,
   documents: ['src/**/*.ts', '!src/gql/generated/**/*'],
   ignoreNoDocuments: true,
   generates: {
      './src/gql/generated/': {
         preset: 'client',
      }
   }
}

export default config
