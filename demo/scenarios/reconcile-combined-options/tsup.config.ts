import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/scenario.ts', 'src/start.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@vaagatech/reconcile-core', '@vaagatech/reconcile-demo-shared'],
});
