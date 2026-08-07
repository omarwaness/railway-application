import { graphql } from './generated'

/**
 * One row in a service list — name, icon and status, keyed off a
 * `ServiceInstance`.
 *
 * It lives on `ServiceInstance` rather than `Service` because that's the only
 * type that reaches both halves of a row: status comes from
 * `latestDeployment`, while `icon` lives on `Service` and nowhere else. The
 * nested `service { ... }` is what avoids a SERVICE_QUERY per row.
 *
 * `serviceId` is selected alongside `id` because they are different things:
 * `id` identifies the instance, `serviceId` is what the service routes take.
 * Without it the list can't link anywhere.
 *
 * `latestDeployment` is null until the service has been deployed at least
 * once, so a brand-new service has no status to show. `staticUrl` is the
 * stable service URL — nullable until a domain exists, and the cheap way to
 * give each row a link without a DOMAINS_QUERY per service.
 *
 * Spread by PROJECT_OVERVIEW_QUERY (base environment) and ENVIRONMENT_QUERY
 * (after an environment switch) so both render from one shape.
 */
export const SERVICE_ROW_FRAGMENT = graphql(`
   fragment ServiceRow on ServiceInstance {
      id
      serviceId
      serviceName
      service {
         id
         name
         icon
         deletedAt
      }
      latestDeployment {
         id
         status
         createdAt
         staticUrl
      }
   }
`)

/**
 * A service's identity — the bits that are the same everywhere it runs.
 *
 * Railway splits a service in two: `Service` holds what the thing *is* (name,
 * icon, which project owns it), while everything about how it *runs* lives on
 * `ServiceInstance`, one per environment. So there is no start command, region
 * or replica count here — that's SERVICE_INSTANCE_QUERY below.
 *
 * `deletedAt` is selected for the same reason as in PROJECTS_QUERY: Railway
 * hands back soft-deleted rows and leaves the filtering to us.
 */
export const SERVICE_QUERY = graphql(`
   query Service($id: String!) {
      service(id: $id) {
         id
         name
         icon
         createdAt
         updatedAt
         deletedAt
         projectId
      }
   }
`)

/**
 * Create a service. One mutation covers all three flavours — the only thing
 * that changes is `source`:
 *
 *   git repo  → source: { repo: "owner/name" }, optionally with `branch`
 *   image     → source: { image: "redis:7-alpine" }
 *   empty     → source omitted entirely
 *
 * `ServiceSourceInput` has exactly two fields, `repo` and `image`, both
 * optional — nothing stops you sending both, so the route validates that only
 * one is set rather than trusting the API to reject it.
 *
 * Only `projectId` is required. `name` is optional and Railway generates one
 * when it's missing, same as `projectCreate`.
 *
 * Beyond the obvious `name`/`icon`/`branch`/`variables`, the input also takes:
 *
 *   environmentId       scopes creation to one environment, but only if that
 *                       environment is a fork. Otherwise the service is
 *                       created in every non-fork environment regardless.
 *   registryCredentials { username, password } — both required together, for
 *                       pulling a private image.
 *   templateId +        must be sent as a pair; for instantiating a service
 *   templateServiceId   out of a template's serialized config.
 *
 * `variables` is Railway's `EnvironmentVariables` scalar, not `JSON` — a flat
 * string→string map (mapped to `Record<string, string>` in codegen.ts). Values
 * are strings on the wire even when they're numbers, so `PORT: "8080"`.
 *
 * The selection mirrors SERVICE_QUERY so the new service can be spliced into
 * a list without a refetch.
 */
export const SERVICE_CREATE_MUTATION = graphql(`
   mutation ServiceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
         id
         name
         icon
         createdAt
         updatedAt
         deletedAt
         projectId
      }
   }
`)

/**
 * Rename a service or change its icon. That is the whole surface:
 * `ServiceUpdateInput` has exactly two fields, `name` and `icon`, both
 * optional — so `{}` is accepted and does nothing. The route requires at
 * least one field, same as `projectUpdate`.
 *
 * Deliberately narrow: this touches identity only. Everything about how the
 * service *runs* is per-environment and goes through `serviceInstanceUpdate`,
 * which takes `(serviceId, environmentId)` and returns a bare Boolean rather
 * than the updated record.
 */
export const SERVICE_UPDATE_MUTATION = graphql(`
   mutation ServiceUpdate($id: String!, $input: ServiceUpdateInput!) {
      serviceUpdate(id: $id, input: $input) {
         id
         name
         icon
         updatedAt
      }
   }
`)

/**
 * Point an existing service at a source. Despite the name, this isn't
 * GitHub-only: `ServiceConnectInput` is `{ repo, branch, image }`, all three
 * optional, so it also connects a service to a Dockerhub/GHCR image. Same
 * mutual-exclusion caveat as `serviceCreate` — repo and image can both be
 * sent and the route is what stops that. `serviceDisconnect(id)` is the
 * inverse.
 *
 * The return type is `Service`, which has no source field, so this can't echo
 * back what it just connected. Confirming the change means re-reading
 * `serviceInstance.source` — which is why SERVICE_INSTANCE_QUERY selects it.
 *
 * Note `branch` is write-only through this path: `ServiceSource` exposes only
 * `repo` and `image`. To display the connected branch, read it from the
 * service's `repoTriggers` connection, whose nodes are `DeploymentTrigger`
 * ({ branch, repository, environmentId, ... }) — one per environment.
 */
export const SERVICE_CONNECT_MUTATION = graphql(`
   mutation ServiceConnect($id: String!, $input: ServiceConnectInput!) {
      serviceConnect(id: $id, input: $input) {
         id
         name
         updatedAt
      }
   }
`)

/**
 * Detach a service from its source — the inverse of SERVICE_CONNECT_MUTATION.
 * Takes only `id`: there's no input type and no way to disconnect just one
 * environment, so this clears the source everywhere at once.
 *
 * Returns `Service`, so it has the same blind spot as `serviceConnect` — the
 * result can't show that the source is gone, because `Service` has no source
 * field. Re-read `serviceInstance.source` (now null) to confirm.
 *
 * The service itself survives with its deployments intact; only the link to
 * the repo or image goes away.
 */
export const SERVICE_DISCONNECT_MUTATION = graphql(`
   mutation ServiceDisconnect($id: String!) {
      serviceDisconnect(id: $id) {
         id
         name
         updatedAt
      }
   }
`)

/**
 * How a service is configured in one environment — the service detail page.
 *
 * Keyed by `(serviceId, environmentId)` because the same service can be
 * deployed differently per environment: staging on one replica, production on
 * three, different start commands, different regions.
 *
 * Almost every config field is nullable, and null means "not set, Railway
 * decides" rather than "empty" — a null `startCommand` runs whatever the
 * builder detected, a null `region` uses the workspace default. Render those
 * as placeholders, not blanks. The two exceptions are `restartPolicyType` and
 * `restartPolicyMaxRetries`, which are non-null and always carry a real value.
 *
 * `latestDeployment` is null until the service has been deployed at least
 * once, so a brand-new service shows no status. `activeDeployments` (not
 * selected) is the field to reach for if the UI ever needs to show a rollout
 * in progress alongside the previous version.
 */
export const SERVICE_INSTANCE_QUERY = graphql(`
   query ServiceInstance($serviceId: String!, $environmentId: String!) {
      serviceInstance(serviceId: $serviceId, environmentId: $environmentId) {
         id
         serviceId
         environmentId
         serviceName
         startCommand
         buildCommand
         rootDirectory
         healthcheckPath
         region
         numReplicas
         source {
            repo
            image
         }
         restartPolicyType
         restartPolicyMaxRetries
         latestDeployment {
            id
            status
            createdAt
         }
      }
   }
`)

/**
 * The whole service detail panel in one request — settings, variables and
 * actions.
 *
 * Batches four root-level reads that the UI would otherwise fire separately:
 * SERVICE_INSTANCE_QUERY, DOMAINS_QUERY, VARIABLES_QUERY and DEPLOYMENTS_QUERY.
 * Two of them fold in structurally rather than just sitting alongside —
 * `serviceInstance.domains` needs no arguments at all (the project/environment/
 * service triple DOMAINS_QUERY takes is already implied by its parent), and
 * `serviceInstance.service` covers the panel header. `variables` and
 * `deployments` stay as sibling root fields; GraphQL resolves all three in
 * parallel.
 *
 * The actions tab gates on `canRedeploy`, `canRollback` and
 * `deploymentStopped` — Railway's own verdicts on which mutations will work,
 * which is more reliable than inferring from `status`.
 *
 * `unrendered` defaults to true because this feeds an editor: rendering
 * references first and saving back would bake `${{Postgres.DATABASE_URL}}`
 * into a literal. Flip it to false for a read-only view. See VARIABLES_QUERY
 * for the full story.
 *
 * Two things to know before leaning on this. One slow field gates the whole
 * response, so the panel paints at the speed of its slowest part. And variable
 * values land in the same payload as everything else — if the variables tab
 * ends up lazy-loaded, pull `variables` back out into its own request.
 *
 * The four originals stay: SERVICE_INSTANCE_QUERY is still the right re-read
 * after `serviceInstanceUpdate`, and DEPLOYMENTS_QUERY is what pages the
 * history past the first `$deploymentLimit`.
 */
export const SERVICE_DETAIL_QUERY = graphql(`
   query ServiceDetail(
      $projectId: String!
      $environmentId: String!
      $serviceId: String!
      $unrendered: Boolean = true
      $deploymentLimit: Int = 10
   ) {
      serviceInstance(serviceId: $serviceId, environmentId: $environmentId) {
         id
         serviceId
         environmentId
         serviceName
         startCommand
         buildCommand
         rootDirectory
         healthcheckPath
         region
         numReplicas
         source {
            repo
            image
         }
         restartPolicyType
         restartPolicyMaxRetries
         service {
            id
            name
            icon
            createdAt
            updatedAt
            deletedAt
            projectId
         }
         latestDeployment {
            id
            status
            statusUpdatedAt
            createdAt
            url
            staticUrl
            canRedeploy
            canRollback
            deploymentStopped
         }
         domains {
            serviceDomains {
               id
               domain
               suffix
               targetPort
               syncStatus
            }
            customDomains {
               id
               domain
               targetPort
               syncStatus
               status {
                  verified
                  certificateStatus
                  verificationToken
                  dnsRecords {
                     hostlabel
                     fqdn
                     recordType
                     purpose
                     requiredValue
                     currentValue
                     status
                     zone
                  }
               }
            }
         }
      }
      variables(
         projectId: $projectId
         environmentId: $environmentId
         serviceId: $serviceId
         unrendered: $unrendered
      )
      deployments(
         first: $deploymentLimit
         input: {
            projectId: $projectId
            environmentId: $environmentId
            serviceId: $serviceId
         }
      ) {
         edges {
            node {
               id
               status
               createdAt
               url
               staticUrl
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
 * Delete a service and everything under it — deployments, variables, domains.
 * Irreversible, and returns a bare `Boolean!`, so `false` means Railway
 * declined without saying why (same shape as `projectDelete`).
 *
 * Deletes the service everywhere. The mutation also accepts an optional
 * `environmentId`, deliberately not exposed here: Railway flags it
 * [Experimental], and it only narrows the delete when the environment is a
 * *fork* — pass a normal environment id and the service is still removed from
 * every non-fork environment. A per-environment delete arg that usually
 * doesn't scope the delete is a trap worth leaving out until it's needed.
 */
export const SERVICE_DELETE_MUTATION = graphql(`
   mutation ServiceDelete($id: String!) {
      serviceDelete(id: $id)
   }
`)

/**
 * Edit a service's per-environment config — the write half of
 * SERVICE_INSTANCE_QUERY, and the only mutation that touches these fields.
 *
 * Scoped to `(serviceId, environmentId)` for the same reason the read is:
 * staging and production are separate rows. `environmentId` is declared
 * `String!` here even though the schema allows omitting it, because a config
 * edit that silently lands in every environment is not something a route
 * should be able to do by accident.
 *
 * `ServiceInstanceUpdateInput` is a superset of what we read back — beyond the
 * fields in SERVICE_INSTANCE_QUERY it also accepts `builder`, `cronSchedule`,
 * `dockerfilePath`, `sleepApplication`, `watchPatterns`, `preDeployCommand`,
 * `drainingSeconds`, `overlapSeconds`, `source`, `registryCredentials`,
 * `nixpacksPlan`, `railwayConfigFile`, `ipv6EgressEnabled` and
 * `multiRegionConfig`. Every one is optional; send only what changed.
 *
 * Returns a bare `Boolean!` — no updated record, no indication of which fields
 * took. Applying immediately (the API has no staged-changes model; that's a
 * dashboard-only concept), so the route should re-run SERVICE_INSTANCE_QUERY
 * afterwards and return the fresh instance. Without that the client has no
 * confirmation of what it just wrote.
 */
export const SERVICE_INSTANCE_UPDATE_MUTATION = graphql(`
   mutation ServiceInstanceUpdate(
      $serviceId: String!
      $environmentId: String!
      $input: ServiceInstanceUpdateInput!
   ) {
      serviceInstanceUpdate(
         serviceId: $serviceId
         environmentId: $environmentId
         input: $input
      )
   }
`)
