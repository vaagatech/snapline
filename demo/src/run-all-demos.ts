import { join } from 'node:path';
import { api, auth, db, seedDb, testSuite } from '@vaagatech/core';
import type { TestSuiteResult } from '@vaagatech/core';

export async function runAllDemos(
  baseUrl: string,
  fixturesDir: string,
): Promise<{ passed: number; failed: number; results: TestSuiteResult[] }> {
  seedDb('postgresql://localhost:5432/src_db', [
    { status: 'ABC', email: 'alice@vaagatech.com', pincode: '111111' },
  ]);
  seedDb('mysql://root@localhost:3306/target_db', [
    { status: 'CBA', email: 'alice@vaagatech.com', pincode: '999999' },
  ]);
  seedDb('postgresql://localhost:5432/app_db', [
    { email: 'alice@vaagatech.com', status: 'SYNCED', role: 'member' },
  ]);

  const authConfig = auth.oauth2({
    tokenUrl: `${baseUrl}/oauth/token`,
    clientId: process.env.CLIENT_ID ?? 'demo-client',
    clientSecret: process.env.CLIENT_SECRET ?? 'demo-secret',
  });

  const dateTransform = {
    currentdate: (value: unknown) =>
      typeof value === 'string' && !Number.isNaN(Date.parse(value))
        ? 'VALID_DATE'
        : 'INVALID_DATE',
  };

  const suites: TestSuiteResult[] = [];

  suites.push(
    await testSuite('1. API vs file (REST)', {
      auth: authConfig,
      baseUrl,
      api: {
        endpoint: '/api/v1/user/sync',
        method: 'POST',
        inputFile: join(fixturesDir, 'rest-input.json'),
        expectedFile: join(fixturesDir, 'rest-expected.json'),
        ignoreFields: ['pincode'],
        transformations: dateTransform,
      },
    }),
  );

  suites.push(
    await testSuite('2. DB vs DB', {
      dbComparison: {
        sourceDb: db.postgres('postgresql://localhost:5432/src_db'),
        targetDb: db.mysql('mysql://root@localhost:3306/target_db'),
        query: 'SELECT status, email FROM users WHERE email = :email',
        params: { email: 'alice@vaagatech.com' },
        dataMapping: { status: { ABC: 'CBA' } },
      },
    }),
  );

  suites.push(
    await testSuite('3. API vs DB', {
      baseUrl,
      apiToDb: {
        api: api.rest({
          endpoint: '/api/v1/users/profile?email=alice@vaagatech.com',
          method: 'GET',
        }),
        db: {
          db: db.postgres('postgresql://localhost:5432/app_db'),
          query: 'SELECT email, status, role FROM users WHERE email = :email',
          params: { email: 'alice@vaagatech.com' },
        },
      },
    }),
  );

  suites.push(
    await testSuite('4. DB vs API', {
      baseUrl,
      dbToApi: {
        db: {
          db: db.postgres('postgresql://localhost:5432/app_db'),
          query: 'SELECT email, status, role FROM users WHERE email = :email',
          params: { email: 'alice@vaagatech.com' },
        },
        api: api.rest({
          endpoint: '/api/v1/users/profile',
          method: 'GET',
        }),
        inputFromDb: true,
      },
    }),
  );

  suites.push(
    await testSuite('5. API vs file (GraphQL)', {
      baseUrl,
      api: {
        ...api.graphql({
          endpoint: '/graphql',
          queryFile: join(fixturesDir, 'graphql-query.graphql'),
          variablesFile: join(fixturesDir, 'graphql-variables.json'),
          dataPath: 'user',
        }),
        expectedFile: join(fixturesDir, 'graphql-expected.json'),
        transformations: dateTransform,
      },
    }),
  );

  suites.push(
    await testSuite('6. API vs file (SOAP)', {
      baseUrl,
      api: {
        ...api.soap({
          endpoint: '/soap/user',
          soapAction: 'GetUser',
          inputFile: join(fixturesDir, 'soap-request.xml'),
        }),
        expectedFile: join(fixturesDir, 'soap-expected.json'),
      },
    }),
  );

  const passed = suites.filter((s) => s.passed).length;
  const failed = suites.length - passed;

  return { passed, failed, results: suites };
}
