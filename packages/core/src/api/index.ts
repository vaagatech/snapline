import { api as apiFactories } from '@vaagatech/snapline-api-adapters';

export const api = {
  rest: apiFactories.rest,
  soap: apiFactories.soap,
  graphql: apiFactories.graphql,
};
