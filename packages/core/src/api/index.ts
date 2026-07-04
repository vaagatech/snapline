import { api as apiFactories } from '@vaagatech/reconcile-api-adapters';

export const api = {
  rest: apiFactories.rest,
  soap: apiFactories.soap,
  graphql: apiFactories.graphql,
};
