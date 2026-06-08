import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  external: ['react', 'react-dom', '@tanstack/react-query', '@use-q/api-client'],
});
