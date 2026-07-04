import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@vaagatech/snapline-core', '@vaagatech/snapline-api-adapters', 'graphql'],
});
