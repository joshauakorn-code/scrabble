/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For a GitHub Pages *project* site the app is served from /<repo>/, so the
// production build uses that base. Local dev (`vite`/`vite preview`) serves from
// root. If the repo is renamed, update the base path below.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/scrabble/' : '/',
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
}));
