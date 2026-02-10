import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        name: 'node',
        test: {
          globals: true,
          environment: 'node',
          include: ['test/**/*.test.ts'],
          testTimeout: 30000,
        },
      },
      {
        name: 'browser',
        test: {
          globals: true,
          environment: 'jsdom',
          include: ['test/**/*.test.ts'],
          testTimeout: 30000,
        },
      },
    ],
  },
});
