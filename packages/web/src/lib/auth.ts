import { writable } from 'svelte/store'
import { type Auth0Client, createAuth0Client } from '@auth0/auth0-spa-js'

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

// Caches the in-flight initialization promise so that concurrent callers
// (initializeAuth0, login, getAccessToken) all await the SAME execution
// instead of racing separate calls to createAuth0Client/handleRedirectCallback.
// Without this, two callers can both see auth0Client === null and both call
// handleRedirectCallback() against the same code/state — the second one
// finds the PKCE transaction already consumed and throws "Invalid state".
let initPromise: Promise<void> | null = null

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

const clearRedirectParams = (): void => {
  window.history.replaceState({}, document.title, window.location.pathname)
}

export async function initializeAuth0 (): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  if (initPromise !== null) {
    // eslint-disable-next-line @typescript-eslint/return-await
    return initPromise
  }

  initPromise = doInitializeAuth0()
  // eslint-disable-next-line @typescript-eslint/return-await
  return initPromise
}

async function doInitializeAuth0 (): Promise<void> {
  // Check if returning with an error in query params
  const searchParams = new URLSearchParams(window.location.search)
  const errorParam = searchParams.get('error')
  const errorDescriptionParam = searchParams.get('error_description')

  if (errorParam != null || errorDescriptionParam != null) {
    const errorMessage = errorParam != null && errorDescriptionParam != null
      ? `${errorParam}: ${errorDescriptionParam}`
      : (errorDescriptionParam ?? errorParam ?? 'Authentication failed')

    try {
      sessionStorage.setItem('auth_error', errorMessage)
    } catch {
      // ignore if sessionStorage is unavailable
    }

    clearRedirectParams()

    authStore.set({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      error: errorMessage
    })
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

    // Check if the user is returning from the login page. Require both
    // code and state to be present so we don't misfire on an unrelated
    // query string that merely contains "code=".
    if (searchParams.has('code') && searchParams.has('state')) {
      await auth0Client.handleRedirectCallback()
      clearRedirectParams()
    }

    const isAuthenticated = await auth0Client.isAuthenticated()

    let user = null
    let accessToken = null

    if (isAuthenticated) {
      user = await auth0Client.getUser()
      accessToken = await auth0Client.getTokenSilently()
    }

    let savedError: string | null = null
    try {
      savedError = sessionStorage.getItem('auth_error')
    } catch {
      // ignore
    }

    authStore.set({
      isLoading: false,
      isAuthenticated,
      user,
      accessToken,
      error: savedError
    })
  } catch (error) {
    // If handleRedirectCallback() failed partway through, the code/state
    // params are still in the URL. Since auth0Client is already set (or
    // this promise is already cached), nothing will retry automatically —
    // strip them so a refresh doesn't attempt to replay a dead transaction.
    clearRedirectParams()

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
  try {
    sessionStorage.removeItem('auth_error')
  } catch {
    // ignore
  }

  await initializeAuth0()

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
  await initializeAuth0()

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

  await initializeAuth0()

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
