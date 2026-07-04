import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/run-demo.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@vaagatech/core'],
});
