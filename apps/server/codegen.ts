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
         config: {
            // Custom scalars have no implied TS type, so codegen emits `unknown`
            // unless told otherwise. Railway sends DateTime as an ISO 8601 string;
            // accepting `Date` on input saves a .toISOString() at every call site.
            scalars: {
               DateTime: { input: 'string | Date', output: 'string' },
               JSON: 'unknown',
               BigInt: 'string',
               // "A map of environment variables" per the schema — values are
               // always strings on the wire, including numeric ports.
               EnvironmentVariables: 'Record<string, string>',
               // Undocumented scalar whose shape varies by deployment source
               // (commit info for repos, tag info for images). Narrow it at
               // the point of use rather than pretending to know it here.
               DeploymentMeta: 'unknown',
               // An environment's whole service/variable config as one blob.
               EnvironmentConfig: 'unknown',
            },
         },
      }
   }
}

export default config
