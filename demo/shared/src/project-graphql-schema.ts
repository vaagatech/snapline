import { buildSchema, graphql, type GraphQLSchema } from 'graphql';

/** Demo domain for project-graphql sample app (3 GraphQL operations). */
export const projectGraphqlDomain = {
  email: 'alice@vaagatech.com',
  customerId: 'cust_1001',
  sqlStatus: 'ACTIVE',
  nosqlStatus: 'ACTV',
  segment: 'ENTERPRISE',
  nosqlSegment: 'ENT',
  orders: [
    { orderId: 'ord_9001', sku: 'SKU-A', quantity: 2, amount: 49.99 },
    { orderId: 'ord_9002', sku: 'SKU-B', quantity: 1, amount: 19.5 },
  ],
};

export const projectGraphqlSchema: GraphQLSchema = buildSchema(`
  type CustomerAccount {
    customerId: ID!
    email: String!
    status: String!
    segment: String!
  }

  type SyncResult {
    customerId: ID!
    email: String!
    status: String!
    segment: String!
    syncedAt: String!
  }

  type OrderLine {
    orderId: ID!
    sku: String!
    quantity: Int!
    amount: Float!
  }

  type Query {
  """Operation 1 — fetch account snapshot"""
    customerAccount(email: String!): CustomerAccount
  """Operation 3 — list order lines for a customer"""
    customerOrders(email: String!, limit: Int = 10): [OrderLine!]!
  }

  type Mutation {
  """Operation 2 — sync profile segment from upstream"""
    syncCustomerProfile(customerId: ID!, segment: String!): SyncResult
  }
`);

function volatileSyncedAt(): string {
  return new Date().toISOString();
}

export const projectGraphqlRoot = {
  customerAccount({ email }: { email: string }) {
    if (email !== projectGraphqlDomain.email) {
      return null;
    }
    return {
      customerId: projectGraphqlDomain.customerId,
      email: projectGraphqlDomain.email,
      status: projectGraphqlDomain.sqlStatus,
      segment: projectGraphqlDomain.segment,
    };
  },
  customerOrders({ email, limit = 10 }: { email: string; limit?: number }) {
    if (email !== projectGraphqlDomain.email) {
      return [];
    }
    return projectGraphqlDomain.orders.slice(0, Math.max(0, limit));
  },
  syncCustomerProfile({ customerId, segment }: { customerId: string; segment: string }) {
    return {
      customerId,
      email: projectGraphqlDomain.email,
      status: projectGraphqlDomain.sqlStatus,
      segment,
      syncedAt: volatileSyncedAt(),
    };
  },
};

export async function executeProjectGraphql(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: unknown; errors?: Array<{ message: string }> }> {
  const result = await graphql({
    schema: projectGraphqlSchema,
    source: query,
    rootValue: projectGraphqlRoot,
    variableValues: variables,
  });

  if (result.errors?.length) {
    return { errors: result.errors.map((error) => ({ message: error.message })) };
  }

  return { data: result.data ?? undefined };
}
