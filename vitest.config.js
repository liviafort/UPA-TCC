import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    css: true,
    include: ['src/tests/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules'],
    coverage: {
      enabled: true,
      provider: 'v8', // Provider v8 requer Node 20+
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      all: true,
      exclude: [
        'node_modules/**',
        'src/tests/**',
        '**/*.config.js',
        '**/index.js',
        '**/*.d.ts',
        'src/assets/**',
        'src/styles/**',
      ],
      include: [
        'src/components/**/*.{js,jsx}',
        'src/services/**/*.{js,jsx}',
        'src/contexts/**/*.{js,jsx}',
        'src/pages/**/*.{js,jsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.json'],
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
