import { graphql } from './generated'

/**
 * Variables for a service in one environment.
 *
 * The field returns Railway's `EnvironmentVariables` scalar — a flat
 * name→value map, not a list of objects, so there are no sub-fields to select
 * and no ids to delete by. Codegen types it as `Record<string, string>` (see
 * the scalar mapping in codegen.ts). Values are always strings.
 *
 * `serviceId` is optional and the omission is meaningful, not a shortcut:
 * leave it out and you get the environment's *shared* variables instead of a
 * service's own. Same field, different scope — worth making explicit in the
 * route rather than letting an undefined id silently widen the query.
 *
 * `unrendered: true` returns references verbatim (`${{Postgres.DATABASE_URL}}`)
 * instead of their resolved values. That's the one to use for an editor —
 * rendering first and saving back would bake the reference into a literal.
 * Default (false) resolves them, which is what a read-only view wants.
 */
export const VARIABLES_QUERY = graphql(`
   query Variables(
      $projectId: String!
      $environmentId: String!
      $serviceId: String
      $unrendered: Boolean
   ) {
      variables(
         projectId: $projectId
         environmentId: $environmentId
         serviceId: $serviceId
         unrendered: $unrendered
      )
   }
`)

/**
 * Every variable a deployment would actually see, fully resolved — service
 * variables merged with shared ones, all references expanded, plus whatever
 * Railway injects itself.
 *
 * Different from VARIABLES_QUERY with `unrendered: false`, which only returns
 * variables set at that scope. This is the deployment's real environment, so
 * it's the query for a "what will this container get?" view. `serviceId` is
 * required here — there's no shared-variable form.
 */
export const VARIABLES_FOR_DEPLOYMENT_QUERY = graphql(`
   query VariablesForServiceDeployment(
      $projectId: String!
      $environmentId: String!
      $serviceId: String!
   ) {
      variablesForServiceDeployment(
         projectId: $projectId
         environmentId: $environmentId
         serviceId: $serviceId
      )
   }
`)

/**
 * Create or overwrite one variable. There is no separate create — upsert is
 * the only write, keyed by `name` within `(projectId, environmentId,
 * serviceId)`. Returns `Boolean!`.
 *
 * `serviceId` omitted writes a shared variable, mirroring VARIABLES_QUERY.
 *
 * The one optional field is `skipDeploys`. Without it, every write triggers a
 * redeploy of the affected services — so a form that saves five variables one
 * at a time causes five deploys. Set it when writing in a batch (or rotating
 * secrets) and trigger the deploy yourself afterwards.
 *
 * Values may contain references in `${{ServiceName.VARIABLE_NAME}}` form;
 * they're stored literally and resolved at deploy time.
 */
export const VARIABLE_UPSERT_MUTATION = graphql(`
   mutation VariableUpsert($input: VariableUpsertInput!) {
      variableUpsert(input: $input)
   }
`)

/**
 * Write many variables in one call — the right tool for a bulk editor, a .env
 * import, or copying variables between environments. Returns `Boolean!`.
 *
 * `variables` is the same name→value map the read returns, so a fetch-edit-save
 * round trip needs no reshaping.
 *
 * Two optional fields, and `replace` is the dangerous one: `replace: true`
 * deletes every variable *not* present in the payload, making this a full
 * overwrite rather than a merge. Only safe when the payload was built from a
 * complete read of the same scope. Default (false) merges.
 *
 * `skipDeploys` works as it does on the single upsert — one deploy for the
 * whole batch instead of none, but still worth suppressing during a migration.
 */
export const VARIABLE_COLLECTION_UPSERT_MUTATION = graphql(`
   mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
   }
`)

/**
 * Delete one variable by name. Returns `Boolean!`.
 *
 * `VariableDeleteInput` is `{ projectId, environmentId, serviceId?, name }` —
 * note there's no `skipDeploys` here, unlike the upserts, so a delete always
 * triggers a deploy. Clearing several variables is cheaper through
 * VARIABLE_COLLECTION_UPSERT_MUTATION with `replace: true`.
 *
 * As everywhere in this file, omitting `serviceId` targets the environment's
 * shared variables.
 */
export const VARIABLE_DELETE_MUTATION = graphql(`
   mutation VariableDelete($input: VariableDeleteInput!) {
      variableDelete(input: $input)
   }
`)
