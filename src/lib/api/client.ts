import { getAccessToken } from '@/lib/auth'
import { TRIPSERVICES_HEADERS } from '@/lib/constants'

/** Error thrown for any failed TripServices request, with a message safe to show an agent. */
export class TripServicesApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(
    message: string,
    options: { status: number; code?: string; details?: unknown; cause?: unknown },
  ) {
    super(message, { cause: options.cause })
    this.name = 'TripServicesApiError'
    this.status = options.status
    this.code = options.code
    this.details = options.details
  }
}

/**
 * Versioned Air API path prefix. The host comes from VITE_TRIPSERVICES_BASE_URL
 * (dev proxy `/tp-api/`, pre-production `https://api.pp.travelport.net/`); Air
 * endpoints are versioned beneath it, resolving to e.g.
 *   https://api.pp.travelport.net/11/air/catalog/search/catalogproductofferings
 * Other TripServices domains use their own prefixes, so this is Air-specific.
 */
export const AIR_API_PREFIX = '11/air'

type QueryValue = string | number | boolean | undefined | null

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  headers?: Record<string, string>
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const baseUrl = import.meta.env.VITE_TRIPSERVICES_BASE_URL
  if (!baseUrl) {
    throw new TripServicesApiError(
      'TripServices base URL is not configured (VITE_TRIPSERVICES_BASE_URL).',
      { status: 0 },
    )
  }

  const trimmed = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  // Support a same-origin base (e.g. the dev-server proxy path "/tp-api/") by
  // resolving it against the page origin; absolute http(s) bases pass through.
  const root = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : new URL(trimmed, window.location.origin).toString()
  const url = new URL(path.replace(/^\//, ''), root)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

async function parseError(response: Response): Promise<TripServicesApiError> {
  let code: string | undefined
  let details: unknown
  let message = `TripServices request failed (${response.status} ${response.statusText}).`

  try {
    const data: unknown = await response.json()
    details = data
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      const apiMessage = record.message ?? record.error_description ?? record.error
      if (typeof apiMessage === 'string' && apiMessage.length > 0) {
        message = apiMessage
      }
      if (typeof record.code === 'string') {
        code = record.code
      }
    }
  } catch {
    /* error body was not JSON — keep the status-based message */
  }

  return new TripServicesApiError(message, { status: response.status, code, details })
}

/**
 * Typed fetch wrapper for the TripServices API. Resolves the base URL, attaches the
 * bearer token, agency-context headers (PCC, Access Group) and the mandatory transport
 * headers (Accept, Accept-Encoding), serialises JSON bodies, and throws a
 * TripServicesApiError with a meaningful message on failure. Pass `options.headers` to
 * add per-call headers such as Air's `Accept-Version` / `Content-Version`.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, headers: extraHeaders, signal } = options

  const url = buildUrl(path, query)
  const token = await getAccessToken()

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    // Mandatory for TripServices. NOTE: Accept-Encoding is a forbidden header name in
    // browsers (the engine manages it), so fetch strips it from direct cross-origin
    // calls; it is forwarded for real by the dev-server / server-side proxy that fronts
    // these requests, where the upstream honours it.
    'Accept-Encoding': 'gzip, deflate',
    [TRIPSERVICES_HEADERS.PCC]: import.meta.env.VITE_TRIPSERVICES_PCC ?? '',
    [TRIPSERVICES_HEADERS.ACCESS_GROUP]: import.meta.env.VITE_TRIPSERVICES_ACCESS_GROUP ?? '',
    // Per-call overrides (e.g. Air's Accept-Version / Content-Version) win over defaults.
    ...extraHeaders,
  }

  const hasBody = body !== undefined && method !== 'GET'
  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (cause) {
    throw new TripServicesApiError(
      'Could not reach TripServices. Check your connection and try again.',
      { status: 0, cause },
    )
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch (cause) {
    throw new TripServicesApiError('TripServices returned an unreadable response.', {
      status: response.status,
      cause,
    })
  }
}

/** Convenience verbs over apiFetch. */
export const tripServicesClient = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
}
