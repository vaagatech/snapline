import { buildSchema, graphql, type GraphQLSchema } from 'graphql';

export const demoGraphqlSchema: GraphQLSchema = buildSchema(`
  type User {
    email: String!
    status: String!
    currentdate: String!
    role: String
  }

  type Query {
    user(email: String!): User
  }
`);

export const demoGraphqlRoot = {
  user({ email }: { email: string }) {
    return {
      email,
      status: 'synced',
      currentdate: new Date().toISOString(),
      role: 'member',
    };
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
