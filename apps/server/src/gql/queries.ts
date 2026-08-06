import { graphql } from './generated'

export const ME_QUERY = graphql(`
   query Me {
      me {
         id
         name
         email
      }
   }
`)
