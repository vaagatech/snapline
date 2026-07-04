export function resolveUrl(endpoint: string, baseUrl?: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  if (!baseUrl) {
    return endpoint;
  }
  return new URL(endpoint, baseUrl).toString();
}
