import { buildSchema, graphql, type GraphQLSchema } from 'graphql';
import { demoDomain, volatileSyncedAt, volatileTraceId } from './demo-domain.js';

export const demoGraphqlSchema: GraphQLSchema = buildSchema(`
  type CustomerProfile {
    role: String!
    department: String!
  }

  type CustomerSubscription {
    planCode: String!
    renewsAt: String!
  }

  type OrderSummary {
    orderId: String!
    status: String!
    total: Float!
    shippedAt: String!
  }

  type CustomerMetadata {
    traceId: String!
    syncedAt: String!
  }

  type CustomerAccount {
    email: String!
    status: String!
    tier: String!
    lastLogin: String!
    profile: CustomerProfile!
    subscription: CustomerSubscription!
    orders: [OrderSummary!]!
    metadata: CustomerMetadata!
  }

  type CustomerSnapshot {
    email: String!
    status: String!
    tier: String!
    role: String!
    department: String!
    planCode: String!
    renewsAt: String!
    lastLogin: String!
  }

  type Query {
    customerAccount(email: String!): CustomerAccount
    customerSnapshot(email: String!): CustomerSnapshot
    user(email: String!): CustomerAccount
  }
`);

function buildCustomerAccount(email: string) {
  return {
    email,
    status: demoDomain.apiStatus,
    tier: demoDomain.tier,
    lastLogin: new Date(demoDomain.lastLogin).toISOString(),
    profile: {
      role: demoDomain.role,
      department: demoDomain.department,
    },
    subscription: {
      planCode: demoDomain.apiPlanCode,
      renewsAt: new Date(demoDomain.renewsAt).toISOString(),
    },
    orders: [
      {
        orderId: 'ord_1001',
        status: demoDomain.orderStatus,
        total: demoDomain.orderTotal,
        shippedAt: new Date(demoDomain.orderShippedAt).toISOString(),
      },
    ],
    metadata: {
      traceId: volatileTraceId(),
      syncedAt: volatileSyncedAt(),
    },
  };
}

export const demoGraphqlRoot = {
  customerAccount({ email }: { email: string }) {
    return buildCustomerAccount(email);
  },
  customerSnapshot({ email }: { email: string }) {
    const account = buildCustomerAccount(email);
    return {
      email: account.email,
      status: account.status,
      tier: account.tier,
      role: account.profile.role,
      department: account.profile.department,
      planCode: account.subscription.planCode,
      renewsAt: account.subscription.renewsAt,
      lastLogin: account.lastLogin,
    };
  },
  user({ email }: { email: string }) {
    return buildCustomerAccount(email);
  },
};

export async function executeDemoGraphql(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: unknown; errors?: Array<{ message: string }> }> {
  const result = await graphql({
    schema: demoGraphqlSchema,
    source: query,
    rootValue: demoGraphqlRoot,
    variableValues: variables,
  });

  if (result.errors?.length) {
    return {
      errors: result.errors.map((error) => ({ message: error.message })),
    };
  }

  return { data: result.data ?? undefined };
}
