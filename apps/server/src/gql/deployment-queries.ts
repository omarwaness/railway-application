import { graphql } from './generated'

// Docs for every document in this file: see ../../README.md

export const DEPLOYMENTS_QUERY = graphql(`
   query Deployments($input: DeploymentListInput!, $first: Int = 10, $after: String) {
      deployments(input: $input, first: $first, after: $after) {
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

export const DEPLOYMENT_QUERY = graphql(`
   query Deployment($id: String!) {
      deployment(id: $id) {
         id
         status
         statusUpdatedAt
         createdAt
         url
         staticUrl
         canRedeploy
         canRollback
         deploymentStopped
         serviceId
         environmentId
         projectId
      }
   }
`)

export const BUILD_LOGS_QUERY = graphql(`
   query BuildLogs(
      $deploymentId: String!
      $limit: Int = 500
      $filter: String
      $startDate: DateTime
      $endDate: DateTime
   ) {
      buildLogs(
         deploymentId: $deploymentId
         limit: $limit
         filter: $filter
         startDate: $startDate
         endDate: $endDate
      ) {
         timestamp
         message
         severity
      }
   }
`)

export const DEPLOYMENT_LOGS_QUERY = graphql(`
   query DeploymentLogs(
      $deploymentId: String!
      $limit: Int = 500
      $filter: String
      $startDate: DateTime
      $endDate: DateTime
   ) {
      deploymentLogs(
         deploymentId: $deploymentId
         limit: $limit
         filter: $filter
         startDate: $startDate
         endDate: $endDate
      ) {
         timestamp
         message
         severity
      }
   }
`)

export const HTTP_LOGS_QUERY = graphql(`
   query HttpLogs($deploymentId: String!, $limit: Int = 100, $filter: String) {
      httpLogs(deploymentId: $deploymentId, limit: $limit, filter: $filter) {
         timestamp
         requestId
         method
         path
         httpStatus
         totalDuration
         srcIp
      }
   }
`)

export const SERVICE_INSTANCE_DEPLOY_MUTATION = graphql(`
   mutation ServiceInstanceDeploy(
      $serviceId: String!
      $environmentId: String!
      $commitSha: String
   ) {
      serviceInstanceDeployV2(
         serviceId: $serviceId
         environmentId: $environmentId
         commitSha: $commitSha
      )
   }
`)

export const SERVICE_INSTANCE_REDEPLOY_MUTATION = graphql(`
   mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
   }
`)

export const ENVIRONMENT_TRIGGERS_DEPLOY_MUTATION = graphql(`
   mutation EnvironmentTriggersDeploy($input: EnvironmentTriggersDeployInput!) {
      environmentTriggersDeploy(input: $input)
   }
`)

export const DEPLOYMENT_REDEPLOY_MUTATION = graphql(`
   mutation DeploymentRedeploy($id: String!) {
      deploymentRedeploy(id: $id) {
         id
         status
         createdAt
      }
   }
`)

export const DEPLOYMENT_RESTART_MUTATION = graphql(`
   mutation DeploymentRestart($id: String!) {
      deploymentRestart(id: $id)
   }
`)

export const DEPLOYMENT_ROLLBACK_MUTATION = graphql(`
   mutation DeploymentRollback($id: String!) {
      deploymentRollback(id: $id)
   }
`)

export const DEPLOYMENT_STOP_MUTATION = graphql(`
   mutation DeploymentStop($id: String!) {
      deploymentStop(id: $id)
   }
`)

export const DEPLOYMENT_CANCEL_MUTATION = graphql(`
   mutation DeploymentCancel($id: String!) {
      deploymentCancel(id: $id)
   }
`)

export const DEPLOYMENT_REMOVE_MUTATION = graphql(`
   mutation DeploymentRemove($id: String!) {
      deploymentRemove(id: $id)
   }
`)
