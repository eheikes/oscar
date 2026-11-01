import adapter from '@sveltejs/adapter-static'
import { type Config, sveltekit } from '@sveltejs/kit/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig, loadEnv } from 'vite'

type CspSources = NonNullable<NonNullable<NonNullable<Config['csp']>['directives']>['connect-src']>

// Use NODE_ENV (if set) as the mode, so `.env.${NODE_ENV}` is loaded.
// Otherwise Vite's default mode applies (development for dev, production for build).
const mode = process.env.NODE_ENV

const originOf = (url: string | undefined): CspSources => url !== undefined && URL.canParse(url) ? [new URL(url).origin as CspSources[number]] : []

export default defineConfig(({ command }) => {
  // Load the same .env files that Vite uses, to get the API & Auth0 origins.
  const env = loadEnv(mode ?? (command === 'build' ? 'production' : 'development'), process.cwd(), 'VITE_')

  return {
    mode,
    plugins: [
      sveltekit({
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
      }),
      basicSsl()
    ]
  }
})
