import { BasicAuthAdapter } from './basic-auth-adapter.js';
import { OAuth2Adapter } from './oauth2-adapter.js';
import { OpenIdAdapter } from './openid-adapter.js';
import type { BasicAuthConfig, OAuth2Config, OpenIdConfig } from './types.js';

export const auth = {
  basic(config: BasicAuthConfig) {
    return new BasicAuthAdapter(config);
  },
  oauth2(config: OAuth2Config) {
    return new OAuth2Adapter(config);
  },
  openid(config: OpenIdConfig) {
    return new OpenIdAdapter(config);
  },
};
