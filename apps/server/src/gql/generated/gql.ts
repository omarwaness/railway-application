/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n   query Projects(\n      $workspaceId: String\n      $first: Int = 20\n      $after: String\n      $orderBy: ProjectsOrderBy = UPDATED_AT_DESC\n      $serviceLimit: Int = 8\n   ) {\n      projects(\n         workspaceId: $workspaceId\n         first: $first\n         after: $after\n         orderBy: $orderBy\n      ) {\n         edges {\n            node {\n               id\n               name\n               description\n               createdAt\n               updatedAt\n               deletedAt\n               isPublic\n               workspaceId\n               baseEnvironmentId\n               services(first: $serviceLimit) {\n                  edges {\n                     node {\n                        id\n                        name\n                        icon\n                        deletedAt\n                     }\n                  }\n               }\n            }\n         }\n         pageInfo {\n            hasNextPage\n            endCursor\n         }\n      }\n   }\n": typeof types.ProjectsDocument,
    "\n   mutation ProjectCreate($input: ProjectCreateInput!) {\n      projectCreate(input: $input) {\n         id\n         name\n         description\n         createdAt\n         updatedAt\n         deletedAt\n         isPublic\n         workspaceId\n         baseEnvironmentId\n      }\n   }\n": typeof types.ProjectCreateDocument,
    "\n   mutation ProjectUpdate($id: String!, $input: ProjectUpdateInput!) {\n      projectUpdate(id: $id, input: $input) {\n         id\n         name\n         description\n         updatedAt\n         isPublic\n         prDeploys\n         botPrEnvironments\n         focusedPrEnvironments\n         baseEnvironmentId\n      }\n   }\n": typeof types.ProjectUpdateDocument,
    "\n   mutation ProjectDelete($id: String!) {\n      projectDelete(id: $id)\n   }\n": typeof types.ProjectDeleteDocument,
    "\n   query Workspaces {\n      apiToken {\n         workspaces {\n            id\n            name\n         }\n      }\n   }\n": typeof types.WorkspacesDocument,
    "\n   query Me {\n      me {\n         id\n         name\n         email\n      }\n   }\n": typeof types.MeDocument,
};
const documents: Documents = {
    "\n   query Projects(\n      $workspaceId: String\n      $first: Int = 20\n      $after: String\n      $orderBy: ProjectsOrderBy = UPDATED_AT_DESC\n      $serviceLimit: Int = 8\n   ) {\n      projects(\n         workspaceId: $workspaceId\n         first: $first\n         after: $after\n         orderBy: $orderBy\n      ) {\n         edges {\n            node {\n               id\n               name\n               description\n               createdAt\n               updatedAt\n               deletedAt\n               isPublic\n               workspaceId\n               baseEnvironmentId\n               services(first: $serviceLimit) {\n                  edges {\n                     node {\n                        id\n                        name\n                        icon\n                        deletedAt\n                     }\n                  }\n               }\n            }\n         }\n         pageInfo {\n            hasNextPage\n            endCursor\n         }\n      }\n   }\n": types.ProjectsDocument,
    "\n   mutation ProjectCreate($input: ProjectCreateInput!) {\n      projectCreate(input: $input) {\n         id\n         name\n         description\n         createdAt\n         updatedAt\n         deletedAt\n         isPublic\n         workspaceId\n         baseEnvironmentId\n      }\n   }\n": types.ProjectCreateDocument,
    "\n   mutation ProjectUpdate($id: String!, $input: ProjectUpdateInput!) {\n      projectUpdate(id: $id, input: $input) {\n         id\n         name\n         description\n         updatedAt\n         isPublic\n         prDeploys\n         botPrEnvironments\n         focusedPrEnvironments\n         baseEnvironmentId\n      }\n   }\n": types.ProjectUpdateDocument,
    "\n   mutation ProjectDelete($id: String!) {\n      projectDelete(id: $id)\n   }\n": types.ProjectDeleteDocument,
    "\n   query Workspaces {\n      apiToken {\n         workspaces {\n            id\n            name\n         }\n      }\n   }\n": types.WorkspacesDocument,
    "\n   query Me {\n      me {\n         id\n         name\n         email\n      }\n   }\n": types.MeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n   query Projects(\n      $workspaceId: String\n      $first: Int = 20\n      $after: String\n      $orderBy: ProjectsOrderBy = UPDATED_AT_DESC\n      $serviceLimit: Int = 8\n   ) {\n      projects(\n         workspaceId: $workspaceId\n         first: $first\n         after: $after\n         orderBy: $orderBy\n      ) {\n         edges {\n            node {\n               id\n               name\n               description\n               createdAt\n               updatedAt\n               deletedAt\n               isPublic\n               workspaceId\n               baseEnvironmentId\n               services(first: $serviceLimit) {\n                  edges {\n                     node {\n                        id\n                        name\n                        icon\n                        deletedAt\n                     }\n                  }\n               }\n            }\n         }\n         pageInfo {\n            hasNextPage\n            endCursor\n         }\n      }\n   }\n"): (typeof documents)["\n   query Projects(\n      $workspaceId: String\n      $first: Int = 20\n      $after: String\n      $orderBy: ProjectsOrderBy = UPDATED_AT_DESC\n      $serviceLimit: Int = 8\n   ) {\n      projects(\n         workspaceId: $workspaceId\n         first: $first\n         after: $after\n         orderBy: $orderBy\n      ) {\n         edges {\n            node {\n               id\n               name\n               description\n               createdAt\n               updatedAt\n               deletedAt\n               isPublic\n               workspaceId\n               baseEnvironmentId\n               services(first: $serviceLimit) {\n                  edges {\n                     node {\n                        id\n                        name\n                        icon\n                        deletedAt\n                     }\n                  }\n               }\n            }\n         }\n         pageInfo {\n            hasNextPage\n            endCursor\n         }\n      }\n   }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n   mutation ProjectCreate($input: ProjectCreateInput!) {\n      projectCreate(input: $input) {\n         id\n         name\n         description\n         createdAt\n         updatedAt\n         deletedAt\n         isPublic\n         workspaceId\n         baseEnvironmentId\n      }\n   }\n"): (typeof documents)["\n   mutation ProjectCreate($input: ProjectCreateInput!) {\n      projectCreate(input: $input) {\n         id\n         name\n         description\n         createdAt\n         updatedAt\n         deletedAt\n         isPublic\n         workspaceId\n         baseEnvironmentId\n      }\n   }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n   mutation ProjectUpdate($id: String!, $input: ProjectUpdateInput!) {\n      projectUpdate(id: $id, input: $input) {\n         id\n         name\n         description\n         updatedAt\n         isPublic\n         prDeploys\n         botPrEnvironments\n         focusedPrEnvironments\n         baseEnvironmentId\n      }\n   }\n"): (typeof documents)["\n   mutation ProjectUpdate($id: String!, $input: ProjectUpdateInput!) {\n      projectUpdate(id: $id, input: $input) {\n         id\n         name\n         description\n         updatedAt\n         isPublic\n         prDeploys\n         botPrEnvironments\n         focusedPrEnvironments\n         baseEnvironmentId\n      }\n   }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n   mutation ProjectDelete($id: String!) {\n      projectDelete(id: $id)\n   }\n"): (typeof documents)["\n   mutation ProjectDelete($id: String!) {\n      projectDelete(id: $id)\n   }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n   query Workspaces {\n      apiToken {\n         workspaces {\n            id\n            name\n         }\n      }\n   }\n"): (typeof documents)["\n   query Workspaces {\n      apiToken {\n         workspaces {\n            id\n            name\n         }\n      }\n   }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n   query Me {\n      me {\n         id\n         name\n         email\n      }\n   }\n"): (typeof documents)["\n   query Me {\n      me {\n         id\n         name\n         email\n      }\n   }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;