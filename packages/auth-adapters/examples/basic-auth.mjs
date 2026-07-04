import { auth } from '@vaagatech/reconcile-auth-adapters';

const adapter = auth.basic({
  username: process.env.API_USERNAME ?? 'demo-user',
  password: process.env.API_PASSWORD ?? 'demo-password',
});

const { headers, token } = await adapter.initialize();

console.log('Authorization header set:', Boolean(headers.Authorization));
console.log('Token available:', Boolean(token));

// Attach headers to any fetch call:
// await fetch('https://api.example.com/resource', { headers });
