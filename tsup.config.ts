import { defineConfig, type Options } from 'tsup';

// Common configuration for all entries
const commonConfig: Partial<Options> = {
  format: ['esm', 'cjs'],
  dts: true,
  shims: true,
  splitting: false,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
};

export default defineConfig([
  // Main library entry
  {
    ...commonConfig,
    entry: ['src/index.ts'],
    clean: true,
  },
  // CLI entry with shebang
  {
    ...commonConfig,
    entry: { cli: 'src/cli.ts' },
    banner: { js: '#!/usr/bin/env node' },
  },
]);
