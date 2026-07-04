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
    '@vaagatech/snapline-api-adapters',
    '@vaagatech/snapline-auth-adapters',
    '@vaagatech/snapline-engine',
    'better-sqlite3',
  ],
});
