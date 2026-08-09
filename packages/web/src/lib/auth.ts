import { writable } from 'svelte/store'
import createAuth0Client, { type Auth0Client } from '@auth0/auth0-spa-js'

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  user: Record<string, unknown> | null
  accessToken: string | null
  error: string | null
}

const initialState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  error: null
}

export const authStore = writable<AuthState>(initialState)

let auth0Client: Auth0Client | null = null

// Get the Auth0 domain and client ID from environment variables
const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE

const getRedirectUri = (): string => {
  const configured = import.meta.env.VITE_AUTH0_REDIRECT_URI
  if (configured != null && configured.trim() !== '') {
    return configured
  }
  return window.location.origin
}

export async function initializeAuth0 (): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  if (auth0Client !== null) {
    return
  }

  try {
    auth0Client = await createAuth0Client({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
      authorizationParams: {
        audience: AUTH0_AUDIENCE,
        redirect_uri: getRedirectUri()
      }
    })

    // Check if the user is returning from the login page
    if (window.location.search.includes('code=')) {
      await auth0Client.handleRedirectCallback()
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const isAuthenticated = await auth0Client.isAuthenticated()

    let user = null
    let accessToken = null

    if (isAuthenticated === true) {
      user = await auth0Client.getUser()
      accessToken = await auth0Client.getTokenSilently()
    }

    authStore.set({
      isLoading: false,
      isAuthenticated,
      user,
      accessToken,
      error: null
    })
  } catch (error) {
    authStore.set({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      error: error instanceof Error ? error.message : 'Failed to initialize Auth0'
    })
  }
}

export async function login (): Promise<void> {
  if (auth0Client === null) {
    await initializeAuth0()
  }

  if (auth0Client === null) {
    throw new Error('Auth0 initialization failed')
  }

  try {
    authStore.update(state => ({ ...state, isLoading: true, error: null }))

    await auth0Client.loginWithRedirect({
      appState: { returnTo: window.location.pathname },
      authorizationParams: {
        audience: AUTH0_AUDIENCE,
        redirect_uri: getRedirectUri()
      }
    })
  } catch (error) {
    authStore.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Login failed'
    }))
  }
}

export async function logout (): Promise<void> {
  if (auth0Client === null) {
    await initializeAuth0()
  }

  if (auth0Client === null) {
    throw new Error('Auth0 initialization failed')
  }

  try {
    authStore.update(state => ({ ...state, isLoading: true, error: null }))

    await auth0Client.logout({ openUrl: false })

    authStore.set({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      error: null
    })
  } catch (error) {
    authStore.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Logout failed'
    }))
  }
}

export async function getAccessToken (): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null
  }

  if (auth0Client === null) {
    await initializeAuth0()
  }

  if (auth0Client === null) {
    return null
  }

  try {
    const token = await auth0Client.getTokenSilently()
    authStore.update(state => ({ ...state, accessToken: token }))
    return token
  } catch (error) {
    return null
  }
}
