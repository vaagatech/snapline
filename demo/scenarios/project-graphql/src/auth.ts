import { auth } from '@vaagatech/snapline-core';
import { requireEnv } from './env.js';

/**
 * Auth0 / Okta (client credentials) — swap tokenUrl for production.
 *
 * Mock demo server:
 *   tokenUrl: `${API_BASE_URL}/oauth/token`
 *
 * Auth0:
 *   tokenUrl: `https://YOUR_TENANT.auth0.com/oauth/token`
 *   scope: 'read:graphql write:graphql'
 *   Add audience via OAuth2Adapter config if your API requires it.
 *
 * Okta:
 *   tokenUrl: `https://YOUR_DOMAIN.okta.com/oauth2/default/v1/token`
 *   scope: 'snapline.graphql'
 */
export function createAuth() {
  const baseUrl = requireEnv('API_BASE_URL');
  return auth.oauth2({
    tokenUrl: process.env.AUTH_TOKEN_URL ?? `${baseUrl}/oauth/token`,
    clientId: requireEnv('CLIENT_ID'),
    clientSecret: requireEnv('CLIENT_SECRET'),
    scope: process.env.AUTH_SCOPE ?? 'read:graphql write:graphql',
  });
}
