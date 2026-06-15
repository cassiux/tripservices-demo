import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthError, __resetAuthForTests, getAccessToken } from '@/lib/auth'

function tokenResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

let nowMs = 1_000_000

beforeEach(() => {
  __resetAuthForTests()
  nowMs = 1_000_000
  vi.spyOn(Date, 'now').mockImplementation(() => nowMs)
  vi.stubEnv('VITE_TRIPSERVICES_AUTH_URL', 'https://auth.example/oauth/token')
  vi.stubEnv('VITE_TRIPSERVICES_CLIENT_ID', 'client-id')
  vi.stubEnv('VITE_TRIPSERVICES_CLIENT_SECRET', 'client-secret')
})

afterEach(() => {
  __resetAuthForTests()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('getAccessToken', () => {
  it('acquires a token via client-credentials and caches it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        tokenResponse({ access_token: 'tok-1', token_type: 'Bearer', expires_in: 3600 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getAccessToken()).resolves.toBe('tok-1')
    await expect(getAccessToken()).resolves.toBe('tok-1')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [, init] = fetchMock.mock.calls[0]
    expect(String(init.body)).toContain('grant_type=client_credentials')
  })

  it('de-duplicates concurrent acquisitions into a single request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        tokenResponse({ access_token: 'tok-1', token_type: 'Bearer', expires_in: 3600 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const [a, b] = await Promise.all([getAccessToken(), getAccessToken()])
    expect(a).toBe('tok-1')
    expect(b).toBe('tok-1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refreshes silently once the cached token nears expiry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        tokenResponse({ access_token: 'tok-1', token_type: 'Bearer', expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        tokenResponse({ access_token: 'tok-2', token_type: 'Bearer', expires_in: 3600 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getAccessToken()).resolves.toBe('tok-1')
    // Advance past (expires_in - refresh margin).
    nowMs += 3_600_000
    await expect(getAccessToken()).resolves.toBe('tok-2')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws AuthError on a non-OK response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_client', error_description: 'bad creds' }), {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getAccessToken()).rejects.toBeInstanceOf(AuthError)
  })

  it('throws AuthError without calling the network when config is missing', async () => {
    vi.stubEnv('VITE_TRIPSERVICES_CLIENT_SECRET', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getAccessToken()).rejects.toBeInstanceOf(AuthError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
