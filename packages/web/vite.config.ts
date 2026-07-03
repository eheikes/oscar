import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    'import.meta.env.API_BASE_URL': JSON.stringify(
      process.env.API_BASE_URL ?? 'http://localhost:8080'
    ),
  },
});
