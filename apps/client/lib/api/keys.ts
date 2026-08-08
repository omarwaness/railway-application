/**
 * Query keys for every read route on the API.
 *
 * Two conventions hold throughout, and both exist to make invalidation a
 * prefix match rather than a list of exact keys:
 *
 *   collections  [entity, "list", filters]
 *   records      [entity, id, subresource, params]
 *
 * So `byId(serviceId)` invalidates that service's identity, instance and
 * detail in one call, and `all()` invalidates the entity outright.
 *
 * Every part is JSON-serializable, which is what TanStack Query's key hashing
 * requires. Undefined fields drop out of the hash, so `list()` and
 * `list({ first: undefined })` are the same cache entry.
 */

type ProjectFilters = {
  workspaceId?: string
  first?: number
  after?: string
  orderBy?: "CREATED_AT_DESC" | "NAME_ASC" | "UPDATED_AT_DESC"
}

type ProjectDetailParams = {
  envFirst?: number
  isEphemeral?: boolean
}

/** Which environment a service is being read in — never optional. */
type EnvironmentScope = {
  environmentId: string
}

type ServiceDetailParams = {
  projectId: string
  environmentId: string
  unrendered?: boolean
  deploymentLimit?: number
}

type EnvironmentFilters = {
  projectId: string
  isEphemeral?: boolean
  first?: number
  after?: string
}

type DeploymentFilters = {
  projectId: string
  environmentId?: string
  serviceId?: string
  status?: string[]
  includeDeleted?: boolean
  first?: number
  after?: string
}

type LogParams = {
  limit?: number
  filter?: string
  startDate?: string
  endDate?: string
}

type HttpLogParams = {
  limit?: number
  filter?: string
}

/** Every domain query is scoped to one service in one environment. */
type DomainScope = {
  projectId: string
  environmentId: string
  serviceId: string
}

/**
 * `scope` mirrors the server's own discriminator: "service" reads a service's
 * own variables, "shared" reads the environment's. Same route, and leaving it
 * out of the key would collapse two different result sets into one entry.
 */
type VariableParams = {
  projectId: string
  environmentId: string
  scope: "service" | "shared"
  serviceId?: string
  unrendered?: boolean
}

type DeploymentVariableParams = {
  projectId: string
  environmentId: string
  serviceId: string
}

export const queryKeys = {
  /**
   * The signed-in user. Not an API route — better-auth serves it — but it
   * belongs here so sign-in, sign-up and sign-out invalidate the same key
   * everything else reads.
   */
  session: {
    all: () => ["session"] as const,
  },

  token: {
    all: () => ["token"] as const,
  },

  projects: {
    all: () => ["projects"] as const,
    lists: () => [...queryKeys.projects.all(), "list"] as const,
    list: (filters: ProjectFilters = {}) =>
      [...queryKeys.projects.lists(), filters] as const,
    byId: (projectId: string) =>
      [...queryKeys.projects.all(), projectId] as const,
    detail: (projectId: string, params: ProjectDetailParams = {}) =>
      [...queryKeys.projects.byId(projectId), "detail", params] as const,
  },

  services: {
    all: () => ["services"] as const,
    byId: (serviceId: string) =>
      [...queryKeys.services.all(), serviceId] as const,
    /** GET /services/:id — name and icon, no per-environment config. */
    identity: (serviceId: string) =>
      [...queryKeys.services.byId(serviceId), "identity"] as const,
    /** GET /services/:id/instance — how it's configured in one environment. */
    instance: (serviceId: string, scope: EnvironmentScope) =>
      [...queryKeys.services.byId(serviceId), "instance", scope] as const,
    /** GET /services/:id/detail — the whole panel in one request. */
    detail: (serviceId: string, params: ServiceDetailParams) =>
      [...queryKeys.services.byId(serviceId), "detail", params] as const,
  },

  environments: {
    all: () => ["environments"] as const,
    lists: () => [...queryKeys.environments.all(), "list"] as const,
    list: (filters: EnvironmentFilters) =>
      [...queryKeys.environments.lists(), filters] as const,
    byId: (environmentId: string) =>
      [...queryKeys.environments.all(), environmentId] as const,
    detail: (environmentId: string, params: { projectId?: string } = {}) =>
      [
        ...queryKeys.environments.byId(environmentId),
        "detail",
        params,
      ] as const,
    logs: (environmentId: string, params: { filter?: string } = {}) =>
      [...queryKeys.environments.byId(environmentId), "logs", params] as const,
    stagedChanges: (environmentId: string) =>
      [
        ...queryKeys.environments.byId(environmentId),
        "staged-changes",
      ] as const,
  },

  deployments: {
    all: () => ["deployments"] as const,
    lists: () => [...queryKeys.deployments.all(), "list"] as const,
    list: (filters: DeploymentFilters) =>
      [...queryKeys.deployments.lists(), filters] as const,
    byId: (deploymentId: string) =>
      [...queryKeys.deployments.all(), deploymentId] as const,
    detail: (deploymentId: string) =>
      [...queryKeys.deployments.byId(deploymentId), "detail"] as const,
    buildLogs: (deploymentId: string, params: LogParams = {}) =>
      [
        ...queryKeys.deployments.byId(deploymentId),
        "build-logs",
        params,
      ] as const,
    logs: (deploymentId: string, params: LogParams = {}) =>
      [...queryKeys.deployments.byId(deploymentId), "logs", params] as const,
    httpLogs: (deploymentId: string, params: HttpLogParams = {}) =>
      [
        ...queryKeys.deployments.byId(deploymentId),
        "http-logs",
        params,
      ] as const,
  },

  domains: {
    all: () => ["domains"] as const,
    lists: () => [...queryKeys.domains.all(), "list"] as const,
    list: (scope: DomainScope) =>
      [...queryKeys.domains.lists(), scope] as const,
    /** Availability of a name the user is typing — not tied to a service. */
    available: (domain: string) =>
      [...queryKeys.domains.all(), "available", domain] as const,
    custom: (domainId: string, params: { projectId: string }) =>
      [...queryKeys.domains.all(), "custom", domainId, params] as const,
  },

  variables: {
    all: () => ["variables"] as const,
    lists: () => [...queryKeys.variables.all(), "list"] as const,
    list: (params: VariableParams) =>
      [...queryKeys.variables.lists(), params] as const,
    /** GET /variables/deployment — the merged, resolved set. */
    forDeployment: (params: DeploymentVariableParams) =>
      [...queryKeys.variables.all(), "deployment", params] as const,
  },
} as const

export type {
  ProjectFilters,
  ProjectDetailParams,
  EnvironmentScope,
  ServiceDetailParams,
  EnvironmentFilters,
  DeploymentFilters,
  LogParams,
  HttpLogParams,
  DomainScope,
  VariableParams,
  DeploymentVariableParams,
}
