/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Builder =
  | 'HEROKU'
  | 'NIXPACKS'
  | 'PAKETO'
  | 'RAILPACK';

export type CertificateStatus =
  | 'CERTIFICATE_STATUS_TYPE_ISSUE_FAILED'
  | 'CERTIFICATE_STATUS_TYPE_ISSUING'
  | 'CERTIFICATE_STATUS_TYPE_UNSPECIFIED'
  | 'CERTIFICATE_STATUS_TYPE_VALID'
  | 'CERTIFICATE_STATUS_TYPE_VALIDATING_OWNERSHIP'
  | 'UNRECOGNIZED';

export type CustomDomainCreateInput = {
  domain: string;
  environmentId: string;
  projectId: string;
  serviceId: string;
  targetPort?: number | null | undefined;
};

export type CustomDomainSyncStatus =
  | 'ACTIVE'
  | 'CREATING'
  | 'DELETED'
  | 'DELETING'
  | 'UNSPECIFIED'
  | 'UPDATING';

export type DnsRecordPurpose =
  | 'DNS_RECORD_PURPOSE_ACME_DNS01_CHALLENGE'
  | 'DNS_RECORD_PURPOSE_TRAFFIC_ROUTE'
  | 'DNS_RECORD_PURPOSE_UNSPECIFIED'
  | 'UNRECOGNIZED';

export type DnsRecordStatus =
  | 'DNS_RECORD_STATUS_PROPAGATED'
  | 'DNS_RECORD_STATUS_REQUIRES_UPDATE'
  | 'DNS_RECORD_STATUS_UNSPECIFIED'
  | 'UNRECOGNIZED';

export type DnsRecordType =
  | 'DNS_RECORD_TYPE_A'
  | 'DNS_RECORD_TYPE_CNAME'
  | 'DNS_RECORD_TYPE_NS'
  | 'DNS_RECORD_TYPE_TXT'
  | 'DNS_RECORD_TYPE_UNSPECIFIED'
  | 'UNRECOGNIZED';

export type DeploymentListInput = {
  environmentId?: string | null | undefined;
  includeDeleted?: boolean | null | undefined;
  projectId?: string | null | undefined;
  serviceId?: string | null | undefined;
  status?: DeploymentStatusInput | null | undefined;
};

export type DeploymentStatus =
  | 'BUILDING'
  | 'CRASHED'
  | 'DEPLOYING'
  | 'FAILED'
  | 'INITIALIZING'
  | 'NEEDS_APPROVAL'
  | 'QUEUED'
  | 'REMOVED'
  | 'REMOVING'
  | 'SKIPPED'
  | 'SLEEPING'
  | 'SUCCESS'
  | 'WAITING';

export type DeploymentStatusInput = {
  in?: Array<DeploymentStatus> | null | undefined;
  notIn?: Array<DeploymentStatus> | null | undefined;
};

export type EnvironmentCreateInput = {
  /** If true, the changes will be applied in the background and the mutation will return immediately. If false, the mutation will wait for the changes to be applied before returning. */
  applyChangesInBackground?: boolean | null | undefined;
  ephemeral?: boolean | null | undefined;
  name: string;
  projectId: string;
  /** When committing the changes immediately, skip any initial deployments. */
  skipInitialDeploys?: boolean | null | undefined;
  /** Create the environment with all of the services, volumes, configuration, and variables from this source environment. */
  sourceEnvironmentId?: string | null | undefined;
  /** Stage the initial changes for the environment. If false (default), the changes will be committed immediately. */
  stageInitialChanges?: boolean | null | undefined;
};

export type EnvironmentPatchStatus =
  | 'APPLYING'
  | 'COMMITTED'
  | 'STAGED';

export type EnvironmentRenameInput = {
  name: string;
};

export type EnvironmentTriggersDeployInput = {
  environmentId: string;
  projectId: string;
  serviceId: string;
};

export type ProjectCreateInput = {
  defaultEnvironmentName?: string | null | undefined;
  description?: string | null | undefined;
  isMonorepo?: boolean | null | undefined;
  isPublic?: boolean | null | undefined;
  name?: string | null | undefined;
  prDeploys?: boolean | null | undefined;
  repo?: ProjectCreateRepo | null | undefined;
  runtime?: PublicRuntime | null | undefined;
  workspaceId?: string | null | undefined;
};

export type ProjectCreateRepo = {
  branch: string;
  fullRepoName: string;
};

export type ProjectUpdateInput = {
  baseEnvironmentId?: string | null | undefined;
  /** Enable/disable pull request environments for PRs created by bots */
  botPrEnvironments?: boolean | null | undefined;
  description?: string | null | undefined;
  /** Enable focused PR environments that only deploy services affected by changed files */
  focusedPrEnvironments?: boolean | null | undefined;
  isPublic?: boolean | null | undefined;
  name?: string | null | undefined;
  prDeploys?: boolean | null | undefined;
};

export type ProjectsOrderBy =
  | 'CREATED_AT_DESC'
  | 'NAME_ASC'
  | 'UPDATED_AT_DESC';

export type PublicRuntime =
  | 'LEGACY'
  | 'UNSPECIFIED'
  | 'V2';

/** Private Docker registry credentials. Only available for Pro plan deployments. */
export type RegistryCredentialsInput = {
  password: string;
  username: string;
};

export type RestartPolicyType =
  | 'ALWAYS'
  | 'NEVER'
  | 'ON_FAILURE';

export type ServiceConnectInput = {
  /** The branch to connect to. e.g. 'main' */
  branch?: string | null | undefined;
  /** Name of the Dockerhub or GHCR image to connect this service to. */
  image?: string | null | undefined;
  /** The full name of the repo to connect to. e.g. 'railwayapp/starters' */
  repo?: string | null | undefined;
};

export type ServiceCreateInput = {
  branch?: string | null | undefined;
  /** Environment ID. If the specified environment is a fork, the service will only be created in it. Otherwise it will created in all environments that are not forks of other environments */
  environmentId?: string | null | undefined;
  icon?: string | null | undefined;
  name?: string | null | undefined;
  projectId: string;
  registryCredentials?: RegistryCredentialsInput | null | undefined;
  source?: ServiceSourceInput | null | undefined;
  /** Template ID. Required when templateServiceId is provided. */
  templateId?: string | null | undefined;
  /** Template service ID within the template's serializedConfig. Required when templateId is provided. */
  templateServiceId?: string | null | undefined;
  variables?: Record<string, string> | null | undefined;
};

export type ServiceDomainCreateInput = {
  environmentId: string;
  serviceId: string;
  targetPort?: number | null | undefined;
};

export type ServiceDomainSyncStatus =
  | 'ACTIVE'
  | 'CREATING'
  | 'DELETED'
  | 'DELETING'
  | 'UNSPECIFIED'
  | 'UPDATING';

export type ServiceInstanceUpdateInput = {
  buildCommand?: string | null | undefined;
  builder?: Builder | null | undefined;
  cronSchedule?: string | null | undefined;
  dockerfilePath?: string | null | undefined;
  drainingSeconds?: number | null | undefined;
  healthcheckPath?: string | null | undefined;
  healthcheckTimeout?: number | null | undefined;
  ipv6EgressEnabled?: boolean | null | undefined;
  multiRegionConfig?: unknown;
  nixpacksPlan?: unknown;
  numReplicas?: number | null | undefined;
  overlapSeconds?: number | null | undefined;
  preDeployCommand?: Array<string> | null | undefined;
  railwayConfigFile?: string | null | undefined;
  region?: string | null | undefined;
  registryCredentials?: RegistryCredentialsInput | null | undefined;
  restartPolicyMaxRetries?: number | null | undefined;
  restartPolicyType?: RestartPolicyType | null | undefined;
  rootDirectory?: string | null | undefined;
  sleepApplication?: boolean | null | undefined;
  source?: ServiceSourceInput | null | undefined;
  startCommand?: string | null | undefined;
  watchPatterns?: Array<string> | null | undefined;
};

export type ServiceSourceInput = {
  image?: string | null | undefined;
  repo?: string | null | undefined;
};

export type ServiceUpdateInput = {
  icon?: string | null | undefined;
  name?: string | null | undefined;
};

export type VariableCollectionUpsertInput = {
  environmentId: string;
  projectId: string;
  /** When set to true, removes all existing variables before upserting the new collection. */
  replace?: boolean | null | undefined;
  serviceId?: string | null | undefined;
  /** Skip deploys for affected services */
  skipDeploys?: boolean | null | undefined;
  variables: Record<string, string>;
};

export type VariableDeleteInput = {
  environmentId: string;
  name: string;
  projectId: string;
  serviceId?: string | null | undefined;
};

export type VariableUpsertInput = {
  environmentId: string;
  name: string;
  projectId: string;
  serviceId?: string | null | undefined;
  /** Skip deploys for affected services */
  skipDeploys?: boolean | null | undefined;
  value: string;
};

export type DeploymentsQueryVariables = Exact<{
  input: DeploymentListInput;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type DeploymentsQuery = { deployments: { edges: Array<{ node: { id: string, status: DeploymentStatus, createdAt: string, url: string | null, staticUrl: string | null } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type DeploymentQueryVariables = Exact<{
  id: string;
}>;


export type DeploymentQuery = { deployment: { id: string, status: DeploymentStatus, statusUpdatedAt: string | null, createdAt: string, url: string | null, staticUrl: string | null, canRedeploy: boolean, canRollback: boolean, deploymentStopped: boolean, serviceId: string | null, environmentId: string, projectId: string } };

export type BuildLogsQueryVariables = Exact<{
  deploymentId: string;
  limit?: number | null | undefined;
  filter?: string | null | undefined;
  startDate?: string | Date | null | undefined;
  endDate?: string | Date | null | undefined;
}>;


export type BuildLogsQuery = { buildLogs: Array<{ timestamp: string, message: string, severity: string | null }> };

export type DeploymentLogsQueryVariables = Exact<{
  deploymentId: string;
  limit?: number | null | undefined;
  filter?: string | null | undefined;
  startDate?: string | Date | null | undefined;
  endDate?: string | Date | null | undefined;
}>;


export type DeploymentLogsQuery = { deploymentLogs: Array<{ timestamp: string, message: string, severity: string | null }> };

export type HttpLogsQueryVariables = Exact<{
  deploymentId: string;
  limit?: number | null | undefined;
  filter?: string | null | undefined;
}>;


export type HttpLogsQuery = { httpLogs: Array<{ timestamp: string, requestId: string, method: string, path: string, httpStatus: number, totalDuration: number, srcIp: string }> };

export type ServiceInstanceDeployMutationVariables = Exact<{
  serviceId: string;
  environmentId: string;
  commitSha?: string | null | undefined;
}>;


export type ServiceInstanceDeployMutation = { serviceInstanceDeployV2: string };

export type ServiceInstanceRedeployMutationVariables = Exact<{
  serviceId: string;
  environmentId: string;
}>;


export type ServiceInstanceRedeployMutation = { serviceInstanceRedeploy: boolean };

export type EnvironmentTriggersDeployMutationVariables = Exact<{
  input: EnvironmentTriggersDeployInput;
}>;


export type EnvironmentTriggersDeployMutation = { environmentTriggersDeploy: boolean };

export type DeploymentRedeployMutationVariables = Exact<{
  id: string;
}>;


export type DeploymentRedeployMutation = { deploymentRedeploy: { id: string, status: DeploymentStatus, createdAt: string } };

export type DeploymentRestartMutationVariables = Exact<{
  id: string;
}>;


export type DeploymentRestartMutation = { deploymentRestart: boolean };

export type DeploymentRollbackMutationVariables = Exact<{
  id: string;
}>;


export type DeploymentRollbackMutation = { deploymentRollback: boolean };

export type DeploymentStopMutationVariables = Exact<{
  id: string;
}>;


export type DeploymentStopMutation = { deploymentStop: boolean };

export type DeploymentCancelMutationVariables = Exact<{
  id: string;
}>;


export type DeploymentCancelMutation = { deploymentCancel: boolean };

export type DeploymentRemoveMutationVariables = Exact<{
  id: string;
}>;


export type DeploymentRemoveMutation = { deploymentRemove: boolean };

export type DomainsQueryVariables = Exact<{
  projectId: string;
  environmentId: string;
  serviceId: string;
}>;


export type DomainsQuery = { domains: { serviceDomains: Array<{ id: string, domain: string, suffix: string | null, targetPort: number | null, syncStatus: ServiceDomainSyncStatus }>, customDomains: Array<{ id: string, domain: string, targetPort: number | null, syncStatus: CustomDomainSyncStatus, status: { verified: boolean, certificateStatus: CertificateStatus, verificationToken: string | null, dnsRecords: Array<{ hostlabel: string, fqdn: string, recordType: DnsRecordType, purpose: DnsRecordPurpose, requiredValue: string, currentValue: string, status: DnsRecordStatus, zone: string }> } }> } };

export type CustomDomainAvailableQueryVariables = Exact<{
  domain: string;
}>;


export type CustomDomainAvailableQuery = { customDomainAvailable: { available: boolean, message: string } };

export type CustomDomainQueryVariables = Exact<{
  id: string;
  projectId: string;
}>;


export type CustomDomainQuery = { customDomain: { id: string, domain: string, targetPort: number | null, serviceId: string, environmentId: string, syncStatus: CustomDomainSyncStatus, status: { verified: boolean, certificateStatus: CertificateStatus, certificateErrorMessage: string | null, certificateRetryable: boolean | null, verificationToken: string | null, verificationDnsHost: string | null, dnsRecords: Array<{ hostlabel: string, fqdn: string, recordType: DnsRecordType, purpose: DnsRecordPurpose, requiredValue: string, currentValue: string, status: DnsRecordStatus, zone: string }> } } };

export type ServiceDomainCreateMutationVariables = Exact<{
  input: ServiceDomainCreateInput;
}>;


export type ServiceDomainCreateMutation = { serviceDomainCreate: { id: string, domain: string, suffix: string | null, targetPort: number | null, syncStatus: ServiceDomainSyncStatus } };

export type ServiceDomainDeleteMutationVariables = Exact<{
  id: string;
}>;


export type ServiceDomainDeleteMutation = { serviceDomainDelete: boolean };

export type CustomDomainCreateMutationVariables = Exact<{
  input: CustomDomainCreateInput;
}>;


export type CustomDomainCreateMutation = { customDomainCreate: { id: string, domain: string, targetPort: number | null, syncStatus: CustomDomainSyncStatus, status: { verified: boolean, certificateStatus: CertificateStatus, verificationToken: string | null, verificationDnsHost: string | null, dnsRecords: Array<{ hostlabel: string, fqdn: string, recordType: DnsRecordType, purpose: DnsRecordPurpose, requiredValue: string, currentValue: string, status: DnsRecordStatus, zone: string }> } } };

export type CustomDomainUpdateMutationVariables = Exact<{
  id: string;
  environmentId: string;
  targetPort?: number | null | undefined;
}>;


export type CustomDomainUpdateMutation = { customDomainUpdate: boolean };

export type CustomDomainDeleteMutationVariables = Exact<{
  id: string;
}>;


export type CustomDomainDeleteMutation = { customDomainDelete: boolean };

export type EnvironmentsQueryVariables = Exact<{
  projectId: string;
  isEphemeral?: boolean | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type EnvironmentsQuery = { environments: { edges: Array<{ node: { id: string, name: string, createdAt: string, updatedAt: string, deletedAt: string | null, isEphemeral: boolean, projectId: string } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type EnvironmentQueryVariables = Exact<{
  id: string;
  projectId?: string | null | undefined;
}>;


export type EnvironmentQuery = { environment: { id: string, name: string, createdAt: string, updatedAt: string, isEphemeral: boolean, projectId: string, unmergedChangesCount: number | null, sourceEnvironment: { id: string, name: string } | null, serviceInstances: { edges: Array<{ node: { ' $fragmentRefs'?: { 'ServiceRowFragment': ServiceRowFragment } } }> } } };

export type EnvironmentLogsQueryVariables = Exact<{
  environmentId: string;
  filter?: string | null | undefined;
}>;


export type EnvironmentLogsQuery = { environmentLogs: Array<{ timestamp: string, message: string, severity: string | null, tags: { serviceId: string | null, deploymentId: string | null } | null }> };

export type EnvironmentStagedChangesQueryVariables = Exact<{
  environmentId: string;
}>;


export type EnvironmentStagedChangesQuery = { environmentStagedChanges: { id: string, status: EnvironmentPatchStatus, message: string | null, createdAt: string, updatedAt: string, appliedAt: string | null, lastAppliedError: string | null } };

export type EnvironmentCreateMutationVariables = Exact<{
  input: EnvironmentCreateInput;
}>;


export type EnvironmentCreateMutation = { environmentCreate: { id: string, name: string, createdAt: string, isEphemeral: boolean, projectId: string, sourceEnvironment: { id: string, name: string } | null } };

export type EnvironmentRenameMutationVariables = Exact<{
  id: string;
  input: EnvironmentRenameInput;
}>;


export type EnvironmentRenameMutation = { environmentRename: { id: string, name: string, updatedAt: string } };

export type EnvironmentDeleteMutationVariables = Exact<{
  id: string;
}>;


export type EnvironmentDeleteMutation = { environmentDelete: boolean };

export type EnvironmentPatchCommitStagedMutationVariables = Exact<{
  environmentId: string;
  commitMessage?: string | null | undefined;
  skipDeploys?: boolean | null | undefined;
}>;


export type EnvironmentPatchCommitStagedMutation = { environmentPatchCommitStaged: string };

export type ProjectsQueryVariables = Exact<{
  workspaceId?: string | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
  orderBy?: ProjectsOrderBy | null | undefined;
  serviceLimit?: number | null | undefined;
}>;


export type ProjectsQuery = { projects: { edges: Array<{ node: { id: string, name: string, description: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, isPublic: boolean, workspaceId: string | null, baseEnvironmentId: string | null, services: { edges: Array<{ node: { id: string, name: string, icon: string | null, deletedAt: string | null } }> } } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }, apiToken: { workspaces: Array<{ id: string, name: string }> } };

export type ProjectOverviewQueryVariables = Exact<{
  id: string;
  envFirst?: number | null | undefined;
  isEphemeral?: boolean | null | undefined;
}>;


export type ProjectOverviewQuery = { project: { id: string, name: string, description: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, isPublic: boolean, workspaceId: string | null, baseEnvironmentId: string | null, environments: { edges: Array<{ node: { id: string, name: string, isEphemeral: boolean, createdAt: string } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }, baseEnvironment: { id: string, name: string, unmergedChangesCount: number | null, serviceInstances: { edges: Array<{ node: { ' $fragmentRefs'?: { 'ServiceRowFragment': ServiceRowFragment } } }> } } | null } };

export type ProjectCreateMutationVariables = Exact<{
  input: ProjectCreateInput;
}>;


export type ProjectCreateMutation = { projectCreate: { id: string, name: string, description: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, isPublic: boolean, workspaceId: string | null, baseEnvironmentId: string | null } };

export type ProjectUpdateMutationVariables = Exact<{
  id: string;
  input: ProjectUpdateInput;
}>;


export type ProjectUpdateMutation = { projectUpdate: { id: string, name: string, description: string | null, updatedAt: string, isPublic: boolean, prDeploys: boolean, botPrEnvironments: boolean, focusedPrEnvironments: boolean, baseEnvironmentId: string | null } };

export type ProjectDeleteMutationVariables = Exact<{
  id: string;
}>;


export type ProjectDeleteMutation = { projectDelete: boolean };

export type WorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type WorkspacesQuery = { apiToken: { workspaces: Array<{ id: string, name: string }> } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, name: string | null, email: string } };

export type ServiceRowFragment = { id: string, serviceId: string, serviceName: string, service: { id: string, name: string, icon: string | null, deletedAt: string | null }, latestDeployment: { id: string, status: DeploymentStatus, createdAt: string, staticUrl: string | null } | null } & { ' $fragmentName'?: 'ServiceRowFragment' };

export type ServiceQueryVariables = Exact<{
  id: string;
}>;


export type ServiceQuery = { service: { id: string, name: string, icon: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, projectId: string } };

export type ServiceCreateMutationVariables = Exact<{
  input: ServiceCreateInput;
}>;


export type ServiceCreateMutation = { serviceCreate: { id: string, name: string, icon: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, projectId: string } };

export type ServiceUpdateMutationVariables = Exact<{
  id: string;
  input: ServiceUpdateInput;
}>;


export type ServiceUpdateMutation = { serviceUpdate: { id: string, name: string, icon: string | null, updatedAt: string } };

export type ServiceConnectMutationVariables = Exact<{
  id: string;
  input: ServiceConnectInput;
}>;


export type ServiceConnectMutation = { serviceConnect: { id: string, name: string, updatedAt: string } };

export type ServiceDisconnectMutationVariables = Exact<{
  id: string;
}>;


export type ServiceDisconnectMutation = { serviceDisconnect: { id: string, name: string, updatedAt: string } };

export type ServiceInstanceQueryVariables = Exact<{
  serviceId: string;
  environmentId: string;
}>;


export type ServiceInstanceQuery = { serviceInstance: { id: string, serviceId: string, environmentId: string, serviceName: string, startCommand: string | null, buildCommand: string | null, rootDirectory: string | null, healthcheckPath: string | null, region: string | null, numReplicas: number | null, restartPolicyType: RestartPolicyType, restartPolicyMaxRetries: number, source: { repo: string | null, image: string | null } | null, latestDeployment: { id: string, status: DeploymentStatus, createdAt: string } | null } };

export type ServiceDetailQueryVariables = Exact<{
  projectId: string;
  environmentId: string;
  serviceId: string;
  unrendered?: boolean | null | undefined;
  deploymentLimit?: number | null | undefined;
}>;


export type ServiceDetailQuery = { variables: Record<string, string>, serviceInstance: { id: string, serviceId: string, environmentId: string, serviceName: string, startCommand: string | null, buildCommand: string | null, rootDirectory: string | null, healthcheckPath: string | null, region: string | null, numReplicas: number | null, restartPolicyType: RestartPolicyType, restartPolicyMaxRetries: number, source: { repo: string | null, image: string | null } | null, service: { id: string, name: string, icon: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, projectId: string }, latestDeployment: { id: string, status: DeploymentStatus, statusUpdatedAt: string | null, createdAt: string, url: string | null, staticUrl: string | null, canRedeploy: boolean, canRollback: boolean, deploymentStopped: boolean } | null, domains: { serviceDomains: Array<{ id: string, domain: string, suffix: string | null, targetPort: number | null, syncStatus: ServiceDomainSyncStatus }>, customDomains: Array<{ id: string, domain: string, targetPort: number | null, syncStatus: CustomDomainSyncStatus, status: { verified: boolean, certificateStatus: CertificateStatus, verificationToken: string | null, dnsRecords: Array<{ hostlabel: string, fqdn: string, recordType: DnsRecordType, purpose: DnsRecordPurpose, requiredValue: string, currentValue: string, status: DnsRecordStatus, zone: string }> } }> } }, deployments: { edges: Array<{ node: { id: string, status: DeploymentStatus, createdAt: string, url: string | null, staticUrl: string | null } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type ServiceDeleteMutationVariables = Exact<{
  id: string;
}>;


export type ServiceDeleteMutation = { serviceDelete: boolean };

export type ServiceInstanceUpdateMutationVariables = Exact<{
  serviceId: string;
  environmentId: string;
  input: ServiceInstanceUpdateInput;
}>;


export type ServiceInstanceUpdateMutation = { serviceInstanceUpdate: boolean };

export type VariablesQueryVariables = Exact<{
  projectId: string;
  environmentId: string;
  serviceId?: string | null | undefined;
  unrendered?: boolean | null | undefined;
}>;


export type VariablesQuery = { variables: Record<string, string> };

export type VariablesForServiceDeploymentQueryVariables = Exact<{
  projectId: string;
  environmentId: string;
  serviceId: string;
}>;


export type VariablesForServiceDeploymentQuery = { variablesForServiceDeployment: Record<string, string> };

export type VariableUpsertMutationVariables = Exact<{
  input: VariableUpsertInput;
}>;


export type VariableUpsertMutation = { variableUpsert: boolean };

export type VariableCollectionUpsertMutationVariables = Exact<{
  input: VariableCollectionUpsertInput;
}>;


export type VariableCollectionUpsertMutation = { variableCollectionUpsert: boolean };

export type VariableDeleteMutationVariables = Exact<{
  input: VariableDeleteInput;
}>;


export type VariableDeleteMutation = { variableDelete: boolean };

export const ServiceRowFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServiceRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServiceInstance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latestDeployment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"staticUrl"}}]}}]}}]} as unknown as DocumentNode<ServiceRowFragment, unknown>;
export const DeploymentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Deployments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeploymentListInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deployments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"staticUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<DeploymentsQuery, DeploymentsQueryVariables>;
export const DeploymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Deployment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deployment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"staticUrl"}},{"kind":"Field","name":{"kind":"Name","value":"canRedeploy"}},{"kind":"Field","name":{"kind":"Name","value":"canRollback"}},{"kind":"Field","name":{"kind":"Name","value":"deploymentStopped"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"environmentId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}}]}}]} as unknown as DocumentNode<DeploymentQuery, DeploymentQueryVariables>;
export const BuildLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BuildLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deploymentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"500"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"buildLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deploymentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deploymentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}}]}}]}}]} as unknown as DocumentNode<BuildLogsQuery, BuildLogsQueryVariables>;
export const DeploymentLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeploymentLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deploymentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"500"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deploymentLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deploymentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deploymentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}}]}}]}}]} as unknown as DocumentNode<DeploymentLogsQuery, DeploymentLogsQueryVariables>;
export const HttpLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HttpLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deploymentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"100"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"httpLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deploymentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deploymentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"httpStatus"}},{"kind":"Field","name":{"kind":"Name","value":"totalDuration"}},{"kind":"Field","name":{"kind":"Name","value":"srcIp"}}]}}]}}]} as unknown as DocumentNode<HttpLogsQuery, HttpLogsQueryVariables>;
export const ServiceInstanceDeployDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceInstanceDeploy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commitSha"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceInstanceDeployV2"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"commitSha"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commitSha"}}}]}]}}]} as unknown as DocumentNode<ServiceInstanceDeployMutation, ServiceInstanceDeployMutationVariables>;
export const ServiceInstanceRedeployDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceInstanceRedeploy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceInstanceRedeploy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}}]}]}}]} as unknown as DocumentNode<ServiceInstanceRedeployMutation, ServiceInstanceRedeployMutationVariables>;
export const EnvironmentTriggersDeployDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentTriggersDeploy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EnvironmentTriggersDeployInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environmentTriggersDeploy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<EnvironmentTriggersDeployMutation, EnvironmentTriggersDeployMutationVariables>;
export const DeploymentRedeployDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeploymentRedeploy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deploymentRedeploy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<DeploymentRedeployMutation, DeploymentRedeployMutationVariables>;
export const DeploymentRestartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeploymentRestart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deploymentRestart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeploymentRestartMutation, DeploymentRestartMutationVariables>;
export const DeploymentRollbackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeploymentRollback"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deploymentRollback"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeploymentRollbackMutation, DeploymentRollbackMutationVariables>;
export const DeploymentStopDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeploymentStop"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deploymentStop"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeploymentStopMutation, DeploymentStopMutationVariables>;
export const DeploymentCancelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeploymentCancel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deploymentCancel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeploymentCancelMutation, DeploymentCancelMutationVariables>;
export const DeploymentRemoveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeploymentRemove"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deploymentRemove"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeploymentRemoveMutation, DeploymentRemoveMutationVariables>;
export const DomainsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Domains"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"domains"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceDomains"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"suffix"}},{"kind":"Field","name":{"kind":"Name","value":"targetPort"}},{"kind":"Field","name":{"kind":"Name","value":"syncStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customDomains"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"targetPort"}},{"kind":"Field","name":{"kind":"Name","value":"syncStatus"}},{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"certificateStatus"}},{"kind":"Field","name":{"kind":"Name","value":"verificationToken"}},{"kind":"Field","name":{"kind":"Name","value":"dnsRecords"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hostlabel"}},{"kind":"Field","name":{"kind":"Name","value":"fqdn"}},{"kind":"Field","name":{"kind":"Name","value":"recordType"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"requiredValue"}},{"kind":"Field","name":{"kind":"Name","value":"currentValue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"zone"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<DomainsQuery, DomainsQueryVariables>;
export const CustomDomainAvailableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CustomDomainAvailable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"domain"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customDomainAvailable"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"domain"},"value":{"kind":"Variable","name":{"kind":"Name","value":"domain"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<CustomDomainAvailableQuery, CustomDomainAvailableQueryVariables>;
export const CustomDomainDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CustomDomain"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customDomain"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"targetPort"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"environmentId"}},{"kind":"Field","name":{"kind":"Name","value":"syncStatus"}},{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"certificateStatus"}},{"kind":"Field","name":{"kind":"Name","value":"certificateErrorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"certificateRetryable"}},{"kind":"Field","name":{"kind":"Name","value":"verificationToken"}},{"kind":"Field","name":{"kind":"Name","value":"verificationDnsHost"}},{"kind":"Field","name":{"kind":"Name","value":"dnsRecords"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hostlabel"}},{"kind":"Field","name":{"kind":"Name","value":"fqdn"}},{"kind":"Field","name":{"kind":"Name","value":"recordType"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"requiredValue"}},{"kind":"Field","name":{"kind":"Name","value":"currentValue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"zone"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CustomDomainQuery, CustomDomainQueryVariables>;
export const ServiceDomainCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceDomainCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServiceDomainCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceDomainCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"suffix"}},{"kind":"Field","name":{"kind":"Name","value":"targetPort"}},{"kind":"Field","name":{"kind":"Name","value":"syncStatus"}}]}}]}}]} as unknown as DocumentNode<ServiceDomainCreateMutation, ServiceDomainCreateMutationVariables>;
export const ServiceDomainDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceDomainDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceDomainDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ServiceDomainDeleteMutation, ServiceDomainDeleteMutationVariables>;
export const CustomDomainCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CustomDomainCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CustomDomainCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customDomainCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"targetPort"}},{"kind":"Field","name":{"kind":"Name","value":"syncStatus"}},{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"certificateStatus"}},{"kind":"Field","name":{"kind":"Name","value":"verificationToken"}},{"kind":"Field","name":{"kind":"Name","value":"verificationDnsHost"}},{"kind":"Field","name":{"kind":"Name","value":"dnsRecords"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hostlabel"}},{"kind":"Field","name":{"kind":"Name","value":"fqdn"}},{"kind":"Field","name":{"kind":"Name","value":"recordType"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"requiredValue"}},{"kind":"Field","name":{"kind":"Name","value":"currentValue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"zone"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CustomDomainCreateMutation, CustomDomainCreateMutationVariables>;
export const CustomDomainUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CustomDomainUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetPort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customDomainUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetPort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetPort"}}}]}]}}]} as unknown as DocumentNode<CustomDomainUpdateMutation, CustomDomainUpdateMutationVariables>;
export const CustomDomainDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CustomDomainDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customDomainDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<CustomDomainDeleteMutation, CustomDomainDeleteMutationVariables>;
export const EnvironmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Environments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isEphemeral"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"20"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"isEphemeral"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isEphemeral"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEphemeral"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<EnvironmentsQuery, EnvironmentsQueryVariables>;
export const EnvironmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Environment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEphemeral"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"unmergedChangesCount"}},{"kind":"Field","name":{"kind":"Name","value":"sourceEnvironment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"serviceInstances"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServiceRow"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServiceRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServiceInstance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latestDeployment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"staticUrl"}}]}}]}}]} as unknown as DocumentNode<EnvironmentQuery, EnvironmentQueryVariables>;
export const EnvironmentLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EnvironmentLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environmentLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"deploymentId"}}]}}]}}]}}]} as unknown as DocumentNode<EnvironmentLogsQuery, EnvironmentLogsQueryVariables>;
export const EnvironmentStagedChangesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EnvironmentStagedChanges"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environmentStagedChanges"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastAppliedError"}}]}}]}}]} as unknown as DocumentNode<EnvironmentStagedChangesQuery, EnvironmentStagedChangesQueryVariables>;
export const EnvironmentCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EnvironmentCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environmentCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEphemeral"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceEnvironment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<EnvironmentCreateMutation, EnvironmentCreateMutationVariables>;
export const EnvironmentRenameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentRename"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EnvironmentRenameInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environmentRename"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<EnvironmentRenameMutation, EnvironmentRenameMutationVariables>;
export const EnvironmentDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environmentDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<EnvironmentDeleteMutation, EnvironmentDeleteMutationVariables>;
export const EnvironmentPatchCommitStagedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentPatchCommitStaged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commitMessage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skipDeploys"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environmentPatchCommitStaged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"commitMessage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commitMessage"}}},{"kind":"Argument","name":{"kind":"Name","value":"skipDeploys"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skipDeploys"}}}]}]}}]} as unknown as DocumentNode<EnvironmentPatchCommitStagedMutation, EnvironmentPatchCommitStagedMutationVariables>;
export const ProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Projects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"20"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectsOrderBy"}},"defaultValue":{"kind":"EnumValue","value":"UPDATED_AT_DESC"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"8"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"baseEnvironmentId"}},{"kind":"Field","name":{"kind":"Name","value":"services"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceLimit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"apiToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectsQuery, ProjectsQueryVariables>;
export const ProjectOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectOverview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"envFirst"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"20"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isEphemeral"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"baseEnvironmentId"}},{"kind":"Field","name":{"kind":"Name","value":"environments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"envFirst"}}},{"kind":"Argument","name":{"kind":"Name","value":"isEphemeral"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isEphemeral"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isEphemeral"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"baseEnvironment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"unmergedChangesCount"}},{"kind":"Field","name":{"kind":"Name","value":"serviceInstances"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServiceRow"}}]}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServiceRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServiceInstance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latestDeployment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"staticUrl"}}]}}]}}]} as unknown as DocumentNode<ProjectOverviewQuery, ProjectOverviewQueryVariables>;
export const ProjectCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProjectCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"baseEnvironmentId"}}]}}]}}]} as unknown as DocumentNode<ProjectCreateMutation, ProjectCreateMutationVariables>;
export const ProjectUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProjectUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"prDeploys"}},{"kind":"Field","name":{"kind":"Name","value":"botPrEnvironments"}},{"kind":"Field","name":{"kind":"Name","value":"focusedPrEnvironments"}},{"kind":"Field","name":{"kind":"Name","value":"baseEnvironmentId"}}]}}]}}]} as unknown as DocumentNode<ProjectUpdateMutation, ProjectUpdateMutationVariables>;
export const ProjectDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProjectDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ProjectDeleteMutation, ProjectDeleteMutationVariables>;
export const WorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Workspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<WorkspacesQuery, WorkspacesQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const ServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Service"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"service"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}}]}}]} as unknown as DocumentNode<ServiceQuery, ServiceQueryVariables>;
export const ServiceCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServiceCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}}]}}]} as unknown as DocumentNode<ServiceCreateMutation, ServiceCreateMutationVariables>;
export const ServiceUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServiceUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ServiceUpdateMutation, ServiceUpdateMutationVariables>;
export const ServiceConnectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceConnect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServiceConnectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceConnect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ServiceConnectMutation, ServiceConnectMutationVariables>;
export const ServiceDisconnectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceDisconnect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceDisconnect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ServiceDisconnectMutation, ServiceDisconnectMutationVariables>;
export const ServiceInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServiceInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"environmentId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}},{"kind":"Field","name":{"kind":"Name","value":"startCommand"}},{"kind":"Field","name":{"kind":"Name","value":"buildCommand"}},{"kind":"Field","name":{"kind":"Name","value":"rootDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"healthcheckPath"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"numReplicas"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"repo"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"Field","name":{"kind":"Name","value":"restartPolicyType"}},{"kind":"Field","name":{"kind":"Name","value":"restartPolicyMaxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"latestDeployment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<ServiceInstanceQuery, ServiceInstanceQueryVariables>;
export const ServiceDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServiceDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unrendered"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":true}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deploymentLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"environmentId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}},{"kind":"Field","name":{"kind":"Name","value":"startCommand"}},{"kind":"Field","name":{"kind":"Name","value":"buildCommand"}},{"kind":"Field","name":{"kind":"Name","value":"rootDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"healthcheckPath"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"numReplicas"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"repo"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"Field","name":{"kind":"Name","value":"restartPolicyType"}},{"kind":"Field","name":{"kind":"Name","value":"restartPolicyMaxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latestDeployment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"staticUrl"}},{"kind":"Field","name":{"kind":"Name","value":"canRedeploy"}},{"kind":"Field","name":{"kind":"Name","value":"canRollback"}},{"kind":"Field","name":{"kind":"Name","value":"deploymentStopped"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domains"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceDomains"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"suffix"}},{"kind":"Field","name":{"kind":"Name","value":"targetPort"}},{"kind":"Field","name":{"kind":"Name","value":"syncStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customDomains"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"targetPort"}},{"kind":"Field","name":{"kind":"Name","value":"syncStatus"}},{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"certificateStatus"}},{"kind":"Field","name":{"kind":"Name","value":"verificationToken"}},{"kind":"Field","name":{"kind":"Name","value":"dnsRecords"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hostlabel"}},{"kind":"Field","name":{"kind":"Name","value":"fqdn"}},{"kind":"Field","name":{"kind":"Name","value":"recordType"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"requiredValue"}},{"kind":"Field","name":{"kind":"Name","value":"currentValue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"zone"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"variables"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"unrendered"},"value":{"kind":"Variable","name":{"kind":"Name","value":"unrendered"}}}]},{"kind":"Field","name":{"kind":"Name","value":"deployments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deploymentLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"staticUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<ServiceDetailQuery, ServiceDetailQueryVariables>;
export const ServiceDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ServiceDeleteMutation, ServiceDeleteMutationVariables>;
export const ServiceInstanceUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServiceInstanceUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServiceInstanceUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceInstanceUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ServiceInstanceUpdateMutation, ServiceInstanceUpdateMutationVariables>;
export const VariablesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Variables"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unrendered"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variables"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"unrendered"},"value":{"kind":"Variable","name":{"kind":"Name","value":"unrendered"}}}]}]}}]} as unknown as DocumentNode<VariablesQuery, VariablesQueryVariables>;
export const VariablesForServiceDeploymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VariablesForServiceDeployment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variablesForServiceDeployment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}}]}]}}]} as unknown as DocumentNode<VariablesForServiceDeploymentQuery, VariablesForServiceDeploymentQueryVariables>;
export const VariableUpsertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VariableUpsert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VariableUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variableUpsert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<VariableUpsertMutation, VariableUpsertMutationVariables>;
export const VariableCollectionUpsertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VariableCollectionUpsert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VariableCollectionUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variableCollectionUpsert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<VariableCollectionUpsertMutation, VariableCollectionUpsertMutationVariables>;
export const VariableDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VariableDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VariableDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variableDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<VariableDeleteMutation, VariableDeleteMutationVariables>;