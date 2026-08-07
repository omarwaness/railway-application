import { graphql } from './generated'

// Docs for every document in this file: see ../../README.md

export const ENVIRONMENTS_QUERY = graphql(`
   query Environments(
      $projectId: String!
      $isEphemeral: Boolean
      $first: Int = 20
      $after: String
   ) {
      environments(
         projectId: $projectId
         isEphemeral: $isEphemeral
         first: $first
         after: $after
      ) {
         edges {
            node {
               id
               name
               createdAt
               updatedAt
               deletedAt
               isEphemeral
               projectId
            }
         }
         pageInfo {
            hasNextPage
            endCursor
         }
      }
   }
`)

export const ENVIRONMENT_QUERY = graphql(`
   query Environment($id: String!, $projectId: String) {
      environment(id: $id, projectId: $projectId) {
         id
         name
         createdAt
         updatedAt
         isEphemeral
         projectId
         unmergedChangesCount
         sourceEnvironment {
            id
            name
         }
         serviceInstances {
            edges {
               node {
                  ...ServiceRow
               }
            }
         }
      }
   }
`)

export const ENVIRONMENT_LOGS_QUERY = graphql(`
   query EnvironmentLogs($environmentId: String!, $filter: String) {
      environmentLogs(environmentId: $environmentId, filter: $filter) {
         timestamp
         message
         severity
         tags {
            serviceId
            deploymentId
         }
      }
   }
`)

export const ENVIRONMENT_STAGED_CHANGES_QUERY = graphql(`
   query EnvironmentStagedChanges($environmentId: String!) {
      environmentStagedChanges(environmentId: $environmentId) {
         id
         status
         message
         createdAt
         updatedAt
         appliedAt
         lastAppliedError
      }
   }
`)

export const ENVIRONMENT_CREATE_MUTATION = graphql(`
   mutation EnvironmentCreate($input: EnvironmentCreateInput!) {
      environmentCreate(input: $input) {
         id
         name
         createdAt
         isEphemeral
         projectId
         sourceEnvironment {
            id
            name
         }
      }
   }
`)

export const ENVIRONMENT_RENAME_MUTATION = graphql(`
   mutation EnvironmentRename($id: String!, $input: EnvironmentRenameInput!) {
      environmentRename(id: $id, input: $input) {
         id
         name
         updatedAt
      }
   }
`)

export const ENVIRONMENT_DELETE_MUTATION = graphql(`
   mutation EnvironmentDelete($id: String!) {
      environmentDelete(id: $id)
   }
`)

export const ENVIRONMENT_PATCH_COMMIT_STAGED_MUTATION = graphql(`
   mutation EnvironmentPatchCommitStaged(
      $environmentId: String!
      $commitMessage: String
      $skipDeploys: Boolean
   ) {
      environmentPatchCommitStaged(
         environmentId: $environmentId
         commitMessage: $commitMessage
         skipDeploys: $skipDeploys
      )
   }
`)
