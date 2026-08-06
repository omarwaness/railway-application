// /**
//  * Throwaway manual test. Run with:  bun run src/gql/test.ts
//  * Fill in RAILWAY_TOKEN below, then delete this file when you're done.
//  */
// import 'dotenv/config'
// import { print } from 'graphql'
// import { graphql } from '../gql/generated/gql'

// const RAILWAY_TOKEN = ''

// const PROJECTS_QUERY = graphql(`
//    query ProjectsScratch {
//       projects {
//          edges {
//             node {
//                id
//                name
//             }
//          }
//       }
//    }
// `)

// const res = await fetch(process.env.RAILWAY_ENDPOINT!, {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${RAILWAY_TOKEN}`,
//     },
//     body: JSON.stringify({ query: print(PROJECTS_QUERY) }),
// })

// const json = await res.json()

// console.log(res.status, res.statusText)
// console.dir(json, { depth: null })


// // v2
// // import 'dotenv/config'
// // import { request, ClientError } from 'graphql-request'
// // import { graphql } from '../gql/generated/gql'

// // const RAILWAY_TOKEN = ''

// // const PROJECTS_QUERY = graphql(`
// //    query Projects {
// //       projects {
// //          edges {
// //             node {
// //                id
// //                name
// //             }
// //          }
// //       }
// //    }
// // `)

// // try {
// //    // `data` is inferred as ProjectsQuery — no casts needed.
// //    const data = await request({
// //       url: process.env.RAILWAY_ENDPOINT!,
// //       document: PROJECTS_QUERY,
// //       requestHeaders: { Authorization: `Bearer ${RAILWAY_TOKEN}` },
// //    })

// //    console.dir(data, { depth: null })
// // } catch (err) {
// //    // Railway returns 200 with an `errors` array, which graphql-request throws as ClientError.
// //    if (err instanceof ClientError) console.dir(err.response, { depth: null })
// //    else throw err
// // }

// // v3
// // import 'dotenv/config'
// // import { ClientError } from 'graphql-request'
// // import { createRailwayClient } from '../lib/graphql-client'
// // import { graphql } from '../gql/generated/gql'

// // const RAILWAY_TOKEN = ''

// // const PROJECTS_QUERY = graphql(`
// //    query Projects {
// //       projects {
// //          edges {
// //             node {
// //                id
// //                name
// //             }
// //          }
// //       }
// //    }
// // `)

// // const client = createRailwayClient(RAILWAY_TOKEN)

// // try {
// //    // `data` is inferred as ProjectsQuery — no casts needed.
// //    const data = await client.request(PROJECTS_QUERY)

// //    console.dir(data, { depth: null })
// // } catch (err) {
// //    // Railway returns 200 with an `errors` array, which graphql-request throws as ClientError.
// //    if (err instanceof ClientError) console.dir(err.response, { depth: null })
// //    else throw err
// // }


