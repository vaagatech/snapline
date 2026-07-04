import type { ApiExecuteContext, ApiExecuteResult, ApiRequestConfig } from './types.js';
import { executeGraphql } from './graphql/execute-graphql.js';
import { executeRest } from './rest/execute-rest.js';
import { executeSoap } from './soap/execute-soap.js';
import { isGraphqlConfig, isRestConfig, isSoapConfig } from './types.js';

export async function executeApi(
  config: ApiRequestConfig,
  context: ApiExecuteContext = {},
): Promise<ApiExecuteResult> {
  if (isRestConfig(config)) {
    return executeRest(config, context);
  }
  if (isSoapConfig(config)) {
    return executeSoap(config, context);
  }
  if (isGraphqlConfig(config)) {
    return executeGraphql(config, context);
  }
  throw new Error('Unsupported API protocol');
}
