import type { AuthResult } from './types.js';

export abstract class AuthAdapter<TConfig extends object = object> {
  protected headers: Record<string, string> = {};
  protected token: string | null = null;

  constructor(protected readonly config: TConfig) {}

  abstract initialize(): Promise<AuthResult>;

  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  getToken(): string | null {
    return this.token;
  }
}
