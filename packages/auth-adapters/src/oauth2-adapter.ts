import { AuthAdapter } from './auth-adapter.js';
import type { OAuth2Config, OAuth2TokenResponse } from './types.js';

export class OAuth2Adapter extends AuthAdapter<OAuth2Config> {
  async initialize() {
    const {
      tokenUrl,
      clientId,
      clientSecret,
      scope,
      fetchImpl = globalThis.fetch,
    } = this.config;

    if (!tokenUrl || !clientId || !clientSecret) {
      throw new Error('OAuth2Adapter requires tokenUrl, clientId, and clientSecret');
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    if (scope) {
      body.set('scope', scope);
    }

    const response = await fetchImpl(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OAuth2 token request failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as OAuth2TokenResponse;
    this.token = payload.access_token ?? null;

    if (!this.token) {
      throw new Error('OAuth2 response did not include access_token');
    }

    this.headers = {
      Authorization: `Bearer ${this.token}`,
    };

    if (payload.token_type) {
      this.headers['X-Token-Type'] = payload.token_type;
    }

    return { headers: this.getHeaders(), token: this.token };
  }
}
