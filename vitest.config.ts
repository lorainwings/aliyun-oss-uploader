import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        'scripts/**',
        'src/cli.ts', // CLI is hard to unit test, would need e2e tests
        'src/index.ts', // Re-export file
        'src/types.ts', // Type definitions only
        '**/.commitlintrc.js',
        '**/.versionrc.js',
      ],
      thresholds: {
        lines: 35,
        functions: 60,
        branches: 70,
        statements: 35,
      },
    },
    include: ['test/**/*.test.ts'],
    testTimeout: 10000,
  },
});
