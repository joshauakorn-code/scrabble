/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For a GitHub Pages *project* site the app is served from /<repo>/, so the
// production build uses that base. Local dev (`vite`/`vite preview`) serves from
// root. Override the Pages base with the VITE_BASE env var if the repo is renamed.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? process.env.VITE_BASE ?? '/scrabble/' : '/',
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
}));
