const BLOCKED_HOSTS = new Set(['169.254.169.254', 'metadata.google.internal']);

export interface SafeUrlOptions {
  /** Block RFC1918 and link-local targets. Default false (localhost demos). */
  blockPrivateNetworks?: boolean;
  /** Block cloud metadata endpoints. Default true. */
  blockMetadataHosts?: boolean;
}

function isPrivateIpv4(host: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) {
    return false;
  }

  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((octet) => octet > 255)) {
    return false;
  }

  const [a, b, c, d] = octets;
  if (a === undefined || b === undefined) return false;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (c === undefined || d === undefined) return false;
  return false;
}

export function assertSafeUrl(url: string, options: SafeUrlOptions = {}): void {
  const blockPrivateNetworks = options.blockPrivateNetworks ?? false;
  const blockMetadataHosts = options.blockMetadataHosts ?? true;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (!/^https?:$/i.test(parsed.protocol)) {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  const host = parsed.hostname.toLowerCase();
  if (blockMetadataHosts && BLOCKED_HOSTS.has(host)) {
    throw new Error(`Blocked metadata host: ${host}`);
  }

  if (blockPrivateNetworks && isPrivateIpv4(host)) {
    throw new Error(`Blocked private-network host: ${host}`);
  }
}
