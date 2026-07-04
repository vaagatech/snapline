import { auth as authFactories } from '@vaagatech/reconcile-auth-adapters';

export const auth = {
  basic: authFactories.basic,
  oauth2: authFactories.oauth2,
  openid: authFactories.openid,
};
