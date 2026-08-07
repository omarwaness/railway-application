import { graphql } from './generated'

// Docs for every document in this file: see ../../README.md

export const PROJECTS_QUERY = graphql(`
   query Projects(
      $workspaceId: String
      $first: Int = 20
      $after: String
      $orderBy: ProjectsOrderBy = UPDATED_AT_DESC
      $serviceLimit: Int = 8
   ) {
      projects(
         workspaceId: $workspaceId
         first: $first
         after: $after
         orderBy: $orderBy
      ) {
         edges {
            node {
               id
               name
               description
               createdAt
               updatedAt
               deletedAt
               isPublic
               workspaceId
               primaryEnvironmentId
               services(first: $serviceLimit) {
                  edges {
                     node {
                        id
                        name
                        icon
                        deletedAt
                     }
                  }
               }
            }
         }
         pageInfo {
            hasNextPage
            endCursor
         }
      }
      apiToken {
         workspaces {
            id
            name
         }
      }
   }
`)

export const PROJECT_OVERVIEW_QUERY = graphql(`
   query ProjectOverview(
      $id: String!
      $envFirst: Int = 20
      $isEphemeral: Boolean = false
   ) {
      project(id: $id) {
         id
         name
         description
         createdAt
         updatedAt
         deletedAt
         isPublic
         workspaceId
         primaryEnvironmentId
         environments(first: $envFirst, isEphemeral: $isEphemeral) {
            edges {
               node {
                  id
                  name
                  isEphemeral
                  createdAt
                  unmergedChangesCount
                  serviceInstances {
                     edges {
                        node {
                           ...ServiceRow
                        }
                     }
                  }
               }
            }
            pageInfo {
               hasNextPage
               endCursor
            }
         }
      }
   }
`)

export const PROJECT_CREATE_MUTATION = graphql(`
   mutation ProjectCreate($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
         id
         name
         description
         createdAt
         updatedAt
         deletedAt
         isPublic
         workspaceId
         primaryEnvironmentId
      }
   }
`)

export const PROJECT_UPDATE_MUTATION = graphql(`
   mutation ProjectUpdate($id: String!, $input: ProjectUpdateInput!) {
      projectUpdate(id: $id, input: $input) {
         id
         name
         description
         updatedAt
         isPublic
         prDeploys
         botPrEnvironments
         focusedPrEnvironments
         primaryEnvironmentId
         baseEnvironmentId
      }
   }
`)

export const PROJECT_DELETE_MUTATION = graphql(`
   mutation ProjectDelete($id: String!) {
      projectDelete(id: $id)
   }
`)

export const WORKSPACES_QUERY = graphql(`
   query Workspaces {
      apiToken {
         workspaces {
            id
            name
         }
      }
   }
`)
