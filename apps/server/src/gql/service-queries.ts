import { graphql } from './generated'

// Docs for every document in this file: see ../../README.md

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

export const SERVICE_CONNECT_MUTATION = graphql(`
   mutation ServiceConnect($id: String!, $input: ServiceConnectInput!) {
      serviceConnect(id: $id, input: $input) {
         id
         name
         updatedAt
      }
   }
`)

export const SERVICE_DISCONNECT_MUTATION = graphql(`
   mutation ServiceDisconnect($id: String!) {
      serviceDisconnect(id: $id) {
         id
         name
         updatedAt
      }
   }
`)

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

export const SERVICE_DELETE_MUTATION = graphql(`
   mutation ServiceDelete($id: String!) {
      serviceDelete(id: $id)
   }
`)

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
