import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/run-all.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@vaagatech/core',
    '@vaagatech/demo-shared',
    /^@vaagatech\/demo-scenario-/,
  ],
});
