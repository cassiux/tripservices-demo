import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetAuthForTests, getAccessToken } from '@/lib/auth'

function tokenResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

beforeEach(() => {
  vi.stubEnv('VITE_TRIPSERVICES_AUTH_URL', 'https://auth.example/oauth/token')
  vi.stubEnv('VITE_TRIPSERVICES_CLIENT_ID', 'client-id')
  vi.stubEnv('VITE_TRIPSERVICES_CLIENT_SECRET', 'client-secret')
  vi.stubEnv('VITE_TRIPSERVICES_USERNAME', 'portal-user')
  vi.stubEnv('VITE_TRIPSERVICES_PASSWORD', 'portal-pass')
})

afterEach(() => {
  __resetAuthForTests()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('getAccessToken', () => {
  it('sends all four credential fields in the form-encoded token request body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        tokenResponse({ access_token: 'tok', token_type: 'Bearer', expires_in: 86400 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const token = await getAccessToken()
    expect(token).toBe('tok')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://auth.example/oauth/token')
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded')

    const body = init.body as URLSearchParams
    const params = body instanceof URLSearchParams ? body : new URLSearchParams(String(body))
    expect(params.get('grant_type')).toBe('password')
    expect(params.get('username')).toBe('portal-user')
    expect(params.get('password')).toBe('portal-pass')
    expect(params.get('client_id')).toBe('client-id')
    expect(params.get('client_secret')).toBe('client-secret')
    expect(params.get('scope')).toBe('openid')
  })

  it('fails fast without calling the network when a credential field is missing', async () => {
    vi.stubEnv('VITE_TRIPSERVICES_PASSWORD', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getAccessToken()).rejects.toMatchObject({ name: 'AuthError' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
