import type { GraphqlApiConfig, RestApiConfig, SoapApiConfig } from './types.js';

export const api = {
  rest(config: Omit<RestApiConfig, 'protocol'>): RestApiConfig {
    return { protocol: 'rest', ...config };
  },
  soap(config: Omit<SoapApiConfig, 'protocol'>): SoapApiConfig {
    return { protocol: 'soap', ...config };
  },
  graphql(config: Omit<GraphqlApiConfig, 'protocol'>): GraphqlApiConfig {
    return { protocol: 'graphql', ...config };
  },
};
