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
    '@vaagatech/api-adapters',
    '@vaagatech/auth-adapters',
    '@vaagatech/reconcile',
    'better-sqlite3',
  ],
});
