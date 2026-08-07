import { graphql } from './generated'

/**
 * Every domain pointing at a service in one environment — both the
 * Railway-provided `*.up.railway.app` ones and any custom domains.
 *
 * This is where a service's public URL actually lives; nothing on `Service` or
 * `ServiceInstance` exposes it. `Deployment.staticUrl` is the cheap
 * alternative when you only need *a* URL and already hold a deployment.
 *
 * `AllDomains` is a plain object with two lists, not a connection — no
 * pagination, no cursors.
 *
 * On the DNS records: `recordType` and `fqdn` are selected beyond what the
 * docs show because a setup guide can't be rendered without them — you can't
 * tell the user to add a CNAME versus a TXT otherwise. `purpose` distinguishes
 * the routing record from the ownership-verification one.
 */
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

/**
 * Whether a custom domain can be attached — call before `customDomainCreate`
 * so the user gets a reason instead of a mutation error.
 *
 * `message` is non-null and populated whether or not the domain is available,
 * so show it either way. `serviceDomainAvailable(domain:)` is the equivalent
 * check for the `*.railway.app` side.
 */
export const CUSTOM_DOMAIN_AVAILABLE_QUERY = graphql(`
   query CustomDomainAvailable($domain: String!) {
      customDomainAvailable(domain: $domain) {
         available
         message
      }
   }
`)

/**
 * One custom domain's DNS and certificate state — the polling target while a
 * user works through setup.
 *
 * Note it needs `projectId` alongside the domain id.
 *
 * The status enums are not what Railway's docs claim. `DNSRecordStatus` is
 * DNS_RECORD_STATUS_PROPAGATED / _REQUIRES_UPDATE / _UNSPECIFIED / UNRECOGNIZED
 * (not PENDING/VALID/INVALID), and `CertificateStatus` is
 * CERTIFICATE_STATUS_TYPE_VALID / _ISSUING / _VALIDATING_OWNERSHIP /
 * _ISSUE_FAILED / _UNSPECIFIED / UNRECOGNIZED (not PENDING/ISSUED/FAILED).
 * Match on the real values.
 *
 * `certificateErrorMessage` and `certificateRetryable` are selected because a
 * failed certificate is the case a user most needs explained — and retryable
 * failures can be re-driven with `customDomainIssueCertificate(id:)`.
 */
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

/**
 * Generate a Railway domain for a service. The name is assigned by Railway —
 * there's no way to request one, so the input is just
 * `{ serviceId, environmentId }` plus an optional `targetPort`.
 *
 * `targetPort` is the container port traffic is forwarded to. Omit it and
 * Railway infers one; set it when the service listens somewhere non-obvious.
 *
 * `syncStatus` is selected because a freshly created domain comes back
 * CREATING, not ACTIVE — it isn't serving traffic the instant this returns.
 */
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

/** Remove a Railway-provided domain. Returns `Boolean!`. */
export const SERVICE_DOMAIN_DELETE_MUTATION = graphql(`
   mutation ServiceDomainDelete($id: String!) {
      serviceDomainDelete(id: $id)
   }
`)

/**
 * Attach a custom domain to a service. Input is
 * `{ projectId, environmentId, serviceId, domain }` with an optional
 * `targetPort`.
 *
 * The domain does not work when this returns — it comes back unverified, and
 * the user has to add DNS records first. Two of them, and the second is easy
 * to miss: the routing record from `status.dnsRecords`, *and* a TXT record
 * built from `status.verificationToken`, which is a separate field rather than
 * an entry in that list. Without the TXT record the domain stays pending
 * forever. Both are selected here so the response alone is enough to render
 * setup instructions.
 *
 * Railway publishes no static IP, so root domains need CNAME-flattening,
 * ALIAS or ANAME — A records are not supported.
 */
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

/**
 * Change which container port a custom domain forwards to. `targetPort` is the
 * only thing that can be updated, and it's nullable — passing null clears the
 * override and returns the domain to inferred routing.
 *
 * Takes loose arguments rather than an input type, needs `environmentId`
 * alongside the id, and returns `Boolean!` — so re-read with
 * CUSTOM_DOMAIN_QUERY to confirm.
 */
export const CUSTOM_DOMAIN_UPDATE_MUTATION = graphql(`
   mutation CustomDomainUpdate($id: String!, $environmentId: String!, $targetPort: Int) {
      customDomainUpdate(id: $id, environmentId: $environmentId, targetPort: $targetPort)
   }
`)

/**
 * Detach a custom domain. Returns `Boolean!`.
 *
 * Only removes it from Railway — the user's DNS records still point here until
 * they clean them up, so a route that deletes should say so.
 */
export const CUSTOM_DOMAIN_DELETE_MUTATION = graphql(`
   mutation CustomDomainDelete($id: String!) {
      customDomainDelete(id: $id)
   }
`)
