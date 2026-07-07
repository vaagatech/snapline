import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/run.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@vaagatech/snapline-core', '@vaagatech/snapline-demo-shared', 'better-sqlite3'],
});
