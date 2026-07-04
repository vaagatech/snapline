import { AuthAdapter } from './auth-adapter.js';
import type { OAuth2TokenResponse, OpenIdConfig } from './types.js';

export class OpenIdAdapter extends AuthAdapter<OpenIdConfig> {
  async initialize() {
    const { token, assertion, idToken, fetchImpl = globalThis.fetch } = this.config;

    if (token) {
      this.token = token;
      this.headers = {
        Authorization: `Bearer ${token}`,
        'X-Auth-Protocol': 'OpenID',
      };
      return { headers: this.getHeaders(), token: this.token };
    }

    if (idToken) {
      this.token = idToken;
      this.headers = {
        Authorization: `Bearer ${idToken}`,
        'X-OpenID-Token': idToken,
        'X-Auth-Protocol': 'OpenID',
      };
      return { headers: this.getHeaders(), token: this.token };
    }

    if (assertion) {
      const { issuer, subject, audience, privateKey, tokenUrl } = assertion;

      if (tokenUrl && fetchImpl) {
        const response = await fetchImpl(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issuer, subject, audience, assertion: privateKey }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`OpenID assertion exchange failed (${response.status}): ${text}`);
        }

        const payload = (await response.json()) as OAuth2TokenResponse;
        this.token = payload.access_token ?? payload.id_token ?? null;
      } else {
        this.token = Buffer.from(
          JSON.stringify({ iss: issuer, sub: subject, aud: audience }),
        ).toString('base64url');
      }

      this.headers = {
        Authorization: `Bearer ${this.token}`,
        'X-OpenID-Assertion': 'true',
        'X-Auth-Protocol': 'OpenID',
      };
      return { headers: this.getHeaders(), token: this.token };
    }

    throw new Error('OpenIdAdapter requires token, idToken, or assertion config');
  }
}
