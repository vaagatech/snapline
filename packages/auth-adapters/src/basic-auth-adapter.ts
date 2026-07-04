import { AuthAdapter } from './auth-adapter.js';
import type { BasicAuthConfig } from './types.js';

export class BasicAuthAdapter extends AuthAdapter<BasicAuthConfig> {
  async initialize() {
    const { username, password } = this.config;
    if (!username || !password) {
      throw new Error('BasicAuthAdapter requires username and password');
    }

    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    this.headers = { Authorization: `Basic ${encoded}` };
    this.token = encoded;
    return { headers: this.getHeaders(), token: this.token };
  }
}
