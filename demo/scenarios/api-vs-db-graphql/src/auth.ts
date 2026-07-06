import { auth } from '@vaagatech/snapline-core';
import { requireEnv } from './env.js';

export function createAuth() {
  const baseUrl = requireEnv('API_BASE_URL');
  return auth.oauth2({
    tokenUrl: `${baseUrl}/oauth/token`,
    clientId: requireEnv('CLIENT_ID'),
    clientSecret: requireEnv('CLIENT_SECRET'),
  });
}
