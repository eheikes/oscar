import { sveltekit } from '@sveltejs/kit/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

export default defineConfig({
  // Use NODE_ENV (if set) as the mode, so `.env.${NODE_ENV}` is loaded.
  // Otherwise Vite's default mode applies (development for dev, production for build).
  mode: process.env.NODE_ENV,
  plugins: [sveltekit(), basicSsl()]
})
