export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Minimal SOAP XML → plain object (no external XML dependency). */
export function parseSoapBody(xml: string): Record<string, unknown> {
  const bodyMatch = xml.match(/<(?:[\w]+:)?Body[^>]*>([\s\S]*?)<\/(?:[\w]+:)?Body>/i);
  const inner = bodyMatch?.[1] ?? xml;
  const result: Record<string, unknown> = {};

  const tagPattern = /<(?:[\w]+:)?(\w+)[^>]*>([^<]*)<\/(?:[\w]+:)?\1>/g;
  let match: RegExpExecArray | null = tagPattern.exec(inner);
  while (match !== null) {
    const key = match[1];
    const value = match[2]?.trim();
    if (key && value !== undefined) {
      result[key] = value;
    }
    match = tagPattern.exec(inner);
  }

  return result;
}

export function buildSoapEnvelope(bodyInnerXml: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
    '<soap:Body>',
    bodyInnerXml,
    '</soap:Body>',
    '</soap:Envelope>',
  ].join('');
}
