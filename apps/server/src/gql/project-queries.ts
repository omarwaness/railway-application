import { graphql } from './generated'

/**
 * Projects for the dashboard grid — one card per project.
 *
 * `projects` spans every workspace the token can see, so pass `workspaceId`
 * to scope it. Services are capped because a card only renders a handful of
 * icons.
 *
 * `deletedAt` is selected at both levels because Railway returns soft-deleted
 * projects regardless of `includeDeleted`, and the services connection has no
 * such arg at all — filtering client-side is the only control available. The
 * route passes both through untouched so the UI decides what to render.
 */
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
               baseEnvironmentId
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
   }
`)

/**
 * Create a project. Every field on ProjectCreateInput is optional, `name`
 * included — sending `{}` gets you a project with a Railway-generated name
 * (verified against the live API).
 *
 * The selection mirrors the card fields in PROJECTS_QUERY so the result can be
 * spliced into the list without a refetch. `services` is omitted because a new
 * project has none; treat it as an empty array on the client.
 */
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
         baseEnvironmentId
      }
   }
`)

/**
 * Update a project's settings. All seven input fields are optional; send only
 * the ones being changed.
 *
 * Note `workspaceId` is NOT updatable — moving a project between workspaces
 * goes through `projectTransfer`, not here.
 */
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
         baseEnvironmentId
      }
   }
`)

/**
 * Delete a project immediately and irreversibly, along with every service,
 * environment, volume and deployment under it. Returns a bare Boolean.
 *
 * Railway's own dashboard uses `projectScheduleDelete` instead, which applies
 * a 48-hour grace period and can be undone with `projectScheduleDeleteCancel`.
 * Prefer that flow for anything user-facing; this one has no undo.
 */
export const PROJECT_DELETE_MUTATION = graphql(`
   mutation ProjectDelete($id: String!) {
      projectDelete(id: $id)
   }
`)

/**
 * Workspaces the current token can reach — powers the workspace switcher.
 *
 * Uses `apiToken` rather than `me { workspaces }` on purpose: `me` resolves
 * the *user* behind the request and returns "Not Authorized" for workspace-
 * and project-scoped tokens, which is what most users will paste in. This
 * field is defined as "the current API token and its accessible workspaces",
 * so it works for account tokens too — at the cost of `avatar`, which
 * ApiTokenWorkspace doesn't expose (it only has `id` and `name`).
 */
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
