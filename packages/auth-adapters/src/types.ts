export type FetchImpl = typeof fetch;

export interface AuthResult {
  headers: Record<string, string>;
  token: string | null;
}

export interface BasicAuthConfig {
  username: string;
  password: string;
}

export interface OAuth2Config {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  fetchImpl?: FetchImpl;
}

export interface OpenIdAssertionConfig {
  issuer: string;
  subject: string;
  audience: string;
  privateKey?: string;
  tokenUrl?: string;
}

export interface OpenIdConfig {
  token?: string;
  idToken?: string;
  assertion?: OpenIdAssertionConfig;
  fetchImpl?: FetchImpl;
}

export interface OAuth2TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  id_token?: string;
}
