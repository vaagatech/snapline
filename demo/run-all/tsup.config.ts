import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/run-all.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@vaagatech/reconcile-core',
    '@vaagatech/reconcile-demo-shared',
    /^@vaagatech\/demo-scenario-/,
  ],
});
