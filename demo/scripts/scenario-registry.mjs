/** Single source of truth for demo scenarios — used by scaffold, run-all sync, and `npm run demo:run`. */

export const SCENARIO_ORDER = [
  'snapline-ignore-fields',
  'snapline-transformations',
  'snapline-data-mapping-lookup',
  'db-vs-db-sqlite',
  'db-vs-db-cross-dialect',
  'nosql-vs-nosql',
  'snapline-data-mapping-function',
  'db-comparison-transformations',
  'snapline-combined-options',
  'api-vs-file-rest',
  'api-vs-file-rest-cases',
  'api-vs-file-graphql',
  'api-vs-file-soap',
  'api-vs-db-rest',
  'api-vs-db-graphql',
  'api-vs-db-soap',
  'db-vs-api-rest',
  'db-vs-api-graphql',
  'db-vs-api-soap',
];

export const SCENARIO_META = {
  'snapline-ignore-fields': {
    title: 'Snapline: ignoreFields (nested paths)',
    modes: ['api', 'api-vs-file'],
    needsServer: true,
    needsDatabase: false,
    fixtures: ['tracked-expected.json'],
  },
  'snapline-transformations': {
    title: 'Snapline: transformations (offline fixture cases)',
    modes: ['runSnaplineFixtureCases', 'transformations'],
    needsServer: false,
    needsDatabase: false,
    fixtures: [],
  },
  'snapline-data-mapping-lookup': {
    title: 'Snapline: dataMapping lookup table (offline fixture cases)',
    modes: ['runSnaplineFixtureCases', 'dataMapping'],
    needsServer: false,
    needsDatabase: false,
    fixtures: [],
  },
  'db-vs-db-sqlite': {
    title: 'DB vs DB (SQLite — same query + linkKeys)',
    modes: ['dbComparison', 'sourceQuery', 'linkKeys'],
    needsServer: false,
    needsDatabase: true,
    fixtures: [],
  },
  'db-vs-db-cross-dialect': {
    title: 'DB vs DB (Postgres vs MySQL seedDb stub)',
    modes: ['dbComparison', 'dataMapping'],
    needsServer: false,
    needsDatabase: false,
    fixtures: [],
  },
  'nosql-vs-nosql': {
    title: 'NoSQL vs NoSQL (document stores + linkKeys)',
    modes: ['dbComparison', 'nosql'],
    needsServer: false,
    needsDatabase: false,
    fixtures: [],
  },
  'snapline-data-mapping-function': {
    title: 'Snapline: dataMapping function (fixture cases + DB)',
    modes: ['runSnaplineFixtureCases', 'dataMapping', 'dbComparison'],
    needsServer: false,
    needsDatabase: true,
    fixtures: [],
  },
  'db-comparison-transformations': {
    title: 'Snapline: transformations (DB vs DB)',
    modes: ['dbComparison', 'transformations'],
    needsServer: false,
    needsDatabase: true,
    fixtures: [],
  },
  'snapline-combined-options': {
    title: 'Snapline: combined options (API vs DB)',
    modes: ['apiToDb', 'ignoreFields', 'transformations', 'dataMapping'],
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  'api-vs-file-rest': {
    title: 'API vs file (REST + OAuth2)',
    modes: ['api', 'api-vs-file', 'auth'],
    needsServer: true,
    needsDatabase: false,
    fixtures: ['rest-input.json', 'rest-expected.json'],
  },
  'api-vs-file-rest-cases': {
    title: 'API vs file (REST fixture cases + OAuth2)',
    modes: ['runApiFixtureCases', 'api-vs-file', 'auth'],
    needsServer: true,
    needsDatabase: false,
    fixtures: [],
  },
  'api-vs-file-graphql': {
    title: 'API vs file (GraphQL fixture cases + OAuth2)',
    modes: ['runApiFixtureCases', 'api-vs-file', 'auth'],
    needsServer: true,
    needsDatabase: false,
    fixtures: [],
  },
  'api-vs-file-soap': {
    title: 'API vs file (SOAP)',
    modes: ['api', 'api-vs-file', 'soap'],
    needsServer: true,
    needsDatabase: false,
    fixtures: ['soap-request.xml', 'soap-expected.json'],
  },
  'api-vs-db-rest': {
    title: 'API vs DB (REST vs SQLite JOIN)',
    modes: ['apiToDb'],
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  'api-vs-db-graphql': {
    title: 'API vs DB (GraphQL + OAuth2 vs SQLite JOIN)',
    modes: ['apiToDb', 'auth'],
    needsServer: true,
    needsDatabase: true,
    fixtures: ['graphql-variables.json'],
  },
  'api-vs-db-soap': {
    title: 'API vs DB (SOAP vs SQLite JOIN)',
    modes: ['apiToDb', 'soap'],
    needsServer: true,
    needsDatabase: true,
    fixtures: ['soap-request.xml'],
  },
  'db-vs-api-rest': {
    title: 'DB vs API (SQLite JOIN vs REST)',
    modes: ['dbToApi', 'inputFromDb'],
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  'db-vs-api-graphql': {
    title: 'DB vs API (SQLite JOIN vs OAuth2 GraphQL)',
    modes: ['dbToApi', 'inputFromDb', 'auth'],
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  'db-vs-api-soap': {
    title: 'DB vs API (SQLite JOIN vs SOAP)',
    modes: ['dbToApi', 'inputFromDb', 'soap'],
    needsServer: true,
    needsDatabase: true,
    fixtures: ['soap-request.xml'],
  },
};

export function workspaceName(id) {
  return `@vaagatech/snapline-demo-scenario-${id}`;
}

export function idToImportName(id) {
  return id
    .split('-')
    .map((part, index) => (index === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join('');
}
