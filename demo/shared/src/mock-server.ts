import { createServer, type Server } from 'node:http';
import { URL } from 'node:url';
import { buildSoapEnvelope } from '@vaagatech/api-adapters';
import { executeDemoGraphql } from './graphql-schema.js';

export const PORT = 3847;

export interface MockServerHandle {
  server: Server;
  baseUrl: string;
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export function createMockServer(): Promise<MockServerHandle> {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

    if (url.pathname === '/oauth/token' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(
        JSON.stringify({
          access_token: 'mock-oauth-token-abc123',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      );
      return;
    }

    if (url.pathname === '/api/v1/user/sync' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      const authHeader = req.headers.authorization ?? '';
      if (!authHeader.startsWith('Bearer ')) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      const body = await readBody(req);
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(body) as Record<string, unknown>;
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      res.writeHead(200);
      res.end(
        JSON.stringify({
          id: input.id ?? 'usr_001',
          email: input.email ?? 'alice@vaagatech.com',
          status: 'synced',
          currentdate: new Date().toISOString(),
          pincode: `${Math.floor(100000 + Math.random() * 900000)}`,
        }),
      );
      return;
    }

    if (url.pathname === '/api/v1/users/profile' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      const email = url.searchParams.get('email') ?? 'alice@vaagatech.com';
      res.writeHead(200);
      res.end(
        JSON.stringify({
          email,
          status: 'SYNCED',
          role: 'member',
        }),
      );
      return;
    }

    if (url.pathname === '/graphql' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      const body = await readBody(req);
      let query = '';
      let variables: Record<string, unknown> = {};

      try {
        const parsed = JSON.parse(body) as {
          query?: string;
          variables?: Record<string, unknown>;
        };
        query = parsed.query ?? '';
        variables = parsed.variables ?? {};
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ errors: [{ message: 'Invalid JSON' }] }));
        return;
      }

      const result = await executeDemoGraphql(query, variables);
      if (result.errors?.length) {
        res.writeHead(400);
        res.end(JSON.stringify({ errors: result.errors }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ data: result.data }));
      return;
    }

    if (url.pathname === '/soap/user' && req.method === 'POST') {
      const body = await readBody(req);
      const emailMatch = body.match(/<email>([^<]+)<\/email>/i);
      const email = emailMatch?.[1] ?? 'alice@vaagatech.com';

      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      res.writeHead(200);
      res.end(
        buildSoapEnvelope(
          `<GetUserResponse><email>${email}</email><status>synced</status><role>member</role></GetUserResponse>`,
        ),
      );
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${PORT}` });
    });
  });
}
