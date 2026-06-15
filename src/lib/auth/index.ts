// Shared auth module. All token handling lives here. Do not reimplement per feature.
//
// TripServices OAuth 2.0 client-credentials flow against VITE_TRIPSERVICES_AUTH_URL.
// The bearer token is held in memory only (never localStorage/sessionStorage) and is
// refreshed silently shortly before it expires. Feature hooks call getAccessToken().
//
// Verified flow (pre-production sandbox):
//   POST {AUTH_URL}  body: grant_type=password
//     &username&password&client_id&client_secret&scope=openid
//   -> 200 { access_token, token_type: "Bearer", expires_in }
//
// All four credential fields are required: the portal username/password and the API
// client_id/client_secret are separate credential pairs from the sandbox provisioning.
//
// SECURITY / CORS: in the browser this posts the sandbox credentials to the auth
// endpoint, which (a) exposes the VITE_-bundled secrets and (b) may be blocked by CORS.
// In production this exchange must move server-side (production auth is Okta). In dev,
// front it with a Vite dev-server proxy. The acquisition logic below is unchanged
// regardless of where it runs.

export class AuthError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AuthError'
  }
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
}

interface CachedToken {
  accessToken: string
  /** Epoch ms at which the token actually expires. */
  expiresAt: number
}

/** Refresh this many ms before real expiry so requests never race the boundary. */
const REFRESH_MARGIN_MS = 60_000

let cached: CachedToken | null = null
let inFlight: Promise<CachedToken> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

function isFresh(token: CachedToken | null): token is CachedToken {
  return token !== null && Date.now() < token.expiresAt - REFRESH_MARGIN_MS
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const data: unknown = await response.clone().json()
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      const detail = record.error_description ?? record.error ?? record.message
      if (typeof detail === 'string') return detail
    }
  } catch {
    /* response body was not JSON — ignore */
  }
  return undefined
}

async function requestToken(): Promise<CachedToken> {
  const authUrl = import.meta.env.VITE_TRIPSERVICES_AUTH_URL
  const clientId = import.meta.env.VITE_TRIPSERVICES_CLIENT_ID
  const clientSecret = import.meta.env.VITE_TRIPSERVICES_CLIENT_SECRET
  const username = import.meta.env.VITE_TRIPSERVICES_USERNAME
  const password = import.meta.env.VITE_TRIPSERVICES_PASSWORD

  if (!authUrl || !clientId || !clientSecret || !username || !password) {
    throw new AuthError(
      'TripServices OAuth is not configured. Set VITE_TRIPSERVICES_AUTH_URL, VITE_TRIPSERVICES_CLIENT_ID, VITE_TRIPSERVICES_CLIENT_SECRET, VITE_TRIPSERVICES_USERNAME and VITE_TRIPSERVICES_PASSWORD in .env.local.',
    )
  }

  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'openid',
  })

  let response: Response
  try {
    response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    })
  } catch (cause) {
    throw new AuthError('Could not reach the authentication service.', { cause })
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response)
    throw new AuthError(
      `Authentication failed (${response.status} ${response.statusText}).${detail ? ` ${detail}` : ''}`,
    )
  }

  let data: TokenResponse
  try {
    data = (await response.json()) as TokenResponse
  } catch (cause) {
    throw new AuthError('The authentication service returned an invalid response.', { cause })
  }

  if (!data.access_token || typeof data.expires_in !== 'number') {
    throw new AuthError('The authentication service returned an unexpected token payload.')
  }

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

function scheduleSilentRefresh(token: CachedToken): void {
  if (refreshTimer) clearTimeout(refreshTimer)
  const delay = Math.max(token.expiresAt - Date.now() - REFRESH_MARGIN_MS, 0)
  refreshTimer = setTimeout(() => {
    // Refresh ahead of expiry; swallow failures here — the next getAccessToken() surfaces them.
    void getAccessToken().catch(() => undefined)
  }, delay)
}

/**
 * Returns a valid TripServices bearer token, acquiring or refreshing it as needed.
 * Concurrent callers share a single in-flight request.
 */
export async function getAccessToken(): Promise<string> {
  if (isFresh(cached)) {
    return cached.accessToken
  }

  if (!inFlight) {
    inFlight = requestToken()
      .then((token) => {
        cached = token
        scheduleSilentRefresh(token)
        return token
      })
      .finally(() => {
        inFlight = null
      })
  }

  const token = await inFlight
  return token.accessToken
}

/** Test-only: clears the in-memory token cache and any pending refresh timer. */
export function __resetAuthForTests(): void {
  cached = null
  inFlight = null
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}
