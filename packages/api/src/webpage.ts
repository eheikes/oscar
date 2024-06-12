/* c8 ignore start -- not for production use */

interface WebpageData {
  isAuthenticated: boolean
  user?: Record<string, any>
}

export const render = (data: WebpageData): string => {
  // Warning: This is not safe! It is vulnerable to XSS attacks.
  // It is meant only for testing, not for production use.
  return `
    <h1>OSCAR</h1>
    <p>${data.isAuthenticated ? '<a href="/logout">Logout</a>' : '<a href="/login">Login</a>'}</p>
    <pre>${data.isAuthenticated ? JSON.stringify(data.user, null, 2) : ''}</pre>
`
}

/* c8 ignore stop */
