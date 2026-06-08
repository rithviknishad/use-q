import { chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: { entry: ['src/index.ts'] },
  sourcemap: true,
  clean: true,
  target: 'es2020',
  async onSuccess() {
    await chmod(resolve(process.cwd(), 'dist/cli.js'), 0o755);
  },
});
