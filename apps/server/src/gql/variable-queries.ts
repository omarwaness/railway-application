import { graphql } from './generated'

// Docs for every document in this file: see ../../README.md

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

export const VARIABLE_UPSERT_MUTATION = graphql(`
   mutation VariableUpsert($input: VariableUpsertInput!) {
      variableUpsert(input: $input)
   }
`)

export const VARIABLE_COLLECTION_UPSERT_MUTATION = graphql(`
   mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
   }
`)

export const VARIABLE_DELETE_MUTATION = graphql(`
   mutation VariableDelete($input: VariableDeleteInput!) {
      variableDelete(input: $input)
   }
`)
