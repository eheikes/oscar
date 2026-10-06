import adapter from '@sveltejs/adapter-static'
import { loadEnv } from 'vite'

// Load the same .env files that Vite uses (see vite.config.ts), to get the API & Auth0 origins.
const mode = process.env.NODE_ENV ?? (process.argv.includes('build') ? 'production' : 'development')
const env = loadEnv(mode, process.cwd(), 'VITE_')
const originOf = (url) => URL.canParse(url) ? [new URL(url).origin] : []

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      fallback: '200.html'
    }),
    // Limit what injected scripts could do, since the Auth0 tokens are kept in localStorage.
    // SvelteKit adds hashes for its own inline scripts.
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'], // for style attributes (app.html and Svelte components)
        'img-src': ['self', 'data:', 'https:'], // for images in Markdown
        'connect-src': [
          'self',
          ...originOf(env.VITE_API_BASE_URL),
          ...originOf(`https://${env.VITE_AUTH0_DOMAIN}`)
        ],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self']
      }
    }
  }
}

export default config
