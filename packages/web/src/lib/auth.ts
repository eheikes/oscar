import { writable } from 'svelte/store'
import { type Auth0Client, createAuth0Client, GenericError } from '@auth0/auth0-spa-js'
import { goto } from '$app/navigation'

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

// Shown to the user for any 401-like auth failure (expired session, missing
// refresh token, rejected access token, etc). The underlying error is logged
// to the console instead, since it's too cryptic to be useful in the UI.
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.'

// sessionStorage key for the page (path + query string, e.g. filters) the
// user was on when they got sent to the login page, so they can be returned
// there afterward. sessionStorage survives the round trip through Auth0.
const RETURN_TO_KEY = 'login_return_to'

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
    if (AUTH0_DOMAIN == null || AUTH0_DOMAIN.trim() === '') {
      throw new Error('VITE_AUTH0_DOMAIN is not configured.')
    }
    if (AUTH0_CLIENT_ID == null || AUTH0_CLIENT_ID.trim() === '') {
      throw new Error('VITE_AUTH0_CLIENT_ID is not configured.')
    }
    if (AUTH0_AUDIENCE == null || AUTH0_AUDIENCE.trim() === '') {
      throw new Error('VITE_AUTH0_AUDIENCE is not configured. An Auth0 API Identifier is required.')
    }

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
      user = (await auth0Client.getUser()) ?? null
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

    console.error('Auth0 initialization failed:', error)

    // Auth0 errors (e.g. "Missing Refresh Token", "login_required") mean the
    // session is no longer usable; anything else is likely misconfiguration.
    let errorMsg = 'Failed to initialize Auth0'
    if (error instanceof GenericError) {
      errorMsg = SESSION_EXPIRED_MESSAGE
    } else if (error instanceof Error) {
      errorMsg = error.message
    }

    authStore.set({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      error: errorMsg
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
    console.error('Failed to get access token:', error)
    return null
  }
}

// Sends the user to the login page, remembering where they were so
// consumeReturnTo() can bring them back after they log in.
export function redirectToLogin (): void {
  if (typeof window === 'undefined') {
    return
  }
  const { pathname, search, hash } = window.location
  if (pathname !== '/login') {
    try {
      sessionStorage.setItem(RETURN_TO_KEY, `${pathname}${search}${hash}`)
    } catch {
      // ignore if sessionStorage is unavailable
    }
  }
  void goto('/login')
}

// Returns (and forgets) the page saved by redirectToLogin(), if any.
export function consumeReturnTo (): string | null {
  let returnTo: string | null = null
  try {
    returnTo = sessionStorage.getItem(RETURN_TO_KEY)
    sessionStorage.removeItem(RETURN_TO_KEY)
  } catch {
    // ignore
  }
  // Only allow same-origin paths.
  if (returnTo == null || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return null
  }
  return returnTo
}
