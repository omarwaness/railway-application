import { graphql } from './generated'

// Docs for every document in this file: see ../../README.md

export const DOMAINS_QUERY = graphql(`
   query Domains($projectId: String!, $environmentId: String!, $serviceId: String!) {
      domains(
         projectId: $projectId
         environmentId: $environmentId
         serviceId: $serviceId
      ) {
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
`)

export const CUSTOM_DOMAIN_AVAILABLE_QUERY = graphql(`
   query CustomDomainAvailable($domain: String!) {
      customDomainAvailable(domain: $domain) {
         available
         message
      }
   }
`)

export const CUSTOM_DOMAIN_QUERY = graphql(`
   query CustomDomain($id: String!, $projectId: String!) {
      customDomain(id: $id, projectId: $projectId) {
         id
         domain
         targetPort
         serviceId
         environmentId
         syncStatus
         status {
            verified
            certificateStatus
            certificateErrorMessage
            certificateRetryable
            verificationToken
            verificationDnsHost
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
`)

export const SERVICE_DOMAIN_CREATE_MUTATION = graphql(`
   mutation ServiceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
         id
         domain
         suffix
         targetPort
         syncStatus
      }
   }
`)

export const SERVICE_DOMAIN_DELETE_MUTATION = graphql(`
   mutation ServiceDomainDelete($id: String!) {
      serviceDomainDelete(id: $id)
   }
`)

export const CUSTOM_DOMAIN_CREATE_MUTATION = graphql(`
   mutation CustomDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
         id
         domain
         targetPort
         syncStatus
         status {
            verified
            certificateStatus
            verificationToken
            verificationDnsHost
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
`)

export const CUSTOM_DOMAIN_UPDATE_MUTATION = graphql(`
   mutation CustomDomainUpdate($id: String!, $environmentId: String!, $targetPort: Int) {
      customDomainUpdate(id: $id, environmentId: $environmentId, targetPort: $targetPort)
   }
`)

export const CUSTOM_DOMAIN_DELETE_MUTATION = graphql(`
   mutation CustomDomainDelete($id: String!) {
      customDomainDelete(id: $id)
   }
`)
