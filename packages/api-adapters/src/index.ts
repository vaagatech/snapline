export type {
  ApiExecuteContext,
  ApiExecuteResult,
  ApiProtocol,
  ApiRequestConfig,
  FetchImpl,
  GraphqlApiConfig,
  HttpMethod,
  RestApiConfig,
  SoapApiConfig,
} from './types.js';

export {
  isGraphqlConfig,
  isRestConfig,
  isSoapConfig,
} from './types.js';

export { api } from './api-factory.js';
export { executeApi } from './execute-api.js';
export { executeGraphql } from './graphql/execute-graphql.js';
export { resolveUrl } from './resolve-url.js';
export { executeRest } from './rest/execute-rest.js';
export { executeSoap } from './soap/execute-soap.js';
export { buildSoapEnvelope, parseSoapBody } from './soap/xml-utils.js';
