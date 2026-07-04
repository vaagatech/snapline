import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    '@vaagatech/reconcile-api-adapters',
    '@vaagatech/reconcile-auth-adapters',
    '@vaagatech/reconcile-engine',
    'better-sqlite3',
  ],
});
