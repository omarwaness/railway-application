import { graphql } from './generated'

/**
 * Everything the dashboard needs in one round trip — the project grid plus the
 * workspaces for the switcher.
 *
 * `apiToken` rides along as a second root field rather than a second request:
 * both are needed to paint the page, and GraphQL will resolve them in
 * parallel. See WORKSPACES_QUERY below for why it's `apiToken` and not `me`.
 *
 * `projects` spans every workspace the token can see, so pass `workspaceId`
 * to scope it. Services are capped because a card only renders a handful of
 * icons — note this makes `services.length` a *display* count, not the real
 * total. Nothing in this schema exposes one: no connection here has a
 * `totalCount`, so an exact figure would mean paging every project's services.
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

/**
 * The /projects/:id page in one request: the project header, the environments
 * for the switcher, and the services running in the base environment.
 *
 * Replaces ENVIRONMENTS_QUERY + ENVIRONMENT_QUERY + a SERVICE_QUERY per row,
 * so the page can load from a project id alone — the case on a direct URL or a
 * refresh. Once the user picks a different environment, switch to
 * ENVIRONMENT_QUERY; it selects the same ...ServiceRow fragment, so the
 * rendered list needs no second shape.
 *
 * `primaryEnvironmentId` is the environment to open on — NOT `baseEnvironment`,
 * which despite the name is where PR deploys fork from and stays null until PR
 * deploys are configured. Verified against the live API: a freshly created
 * project comes back with `baseEnvironmentId` null while `environments` already
 * holds the production environment it was created with. Selecting the wrong one
 * leaves the page with no environment id and every downstream call unusable.
 *
 * There is no `primaryEnvironment` object field to go with the id — only the id
 * — which is why `serviceInstances` hangs off the environments connection here
 * rather than off one environment. The route matches the id against that list
 * and already holds the services, so this stays a single request. Environments
 * the user hasn't opened cost a service list each; that's the price of not
 * making the page wait on a second round trip.
 *
 * `isEphemeral: false` keeps PR/preview environments out of the switcher by
 * default; pass `null` to include them.
 *
 * Ordering note: `Project.environments` takes `sort`, not the `orderBy` the
 * root `environments` field uses. Left unset here — the switcher is short
 * enough that creation order reads fine.
 */
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
         primaryEnvironmentId
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
         primaryEnvironmentId
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
