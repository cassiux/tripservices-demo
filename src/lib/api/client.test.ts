import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TripServicesApiError, apiFetch } from '@/lib/api/client'

vi.mock('@/lib/auth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('test-token'),
}))

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

beforeEach(() => {
  vi.stubEnv('VITE_TRIPSERVICES_BASE_URL', 'https://api.example/')
  vi.stubEnv('VITE_TRIPSERVICES_PCC', '7K9S')
  vi.stubEnv('VITE_TRIPSERVICES_ACCESS_GROUP', 'GROUP-GUID')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('apiFetch', () => {
  it('injects auth, PCC and access-group headers and returns parsed JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const data = await apiFetch<{ ok: boolean }>('trips/abc')
    expect(data).toEqual({ ok: true })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.example/trips/abc')
    expect(init.headers.Authorization).toBe('Bearer test-token')
    expect(init.headers.PCC).toBe('7K9S')
    expect(init.headers['Access-Group']).toBe('GROUP-GUID')
  })

  it('serialises a JSON body for non-GET requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: '1' }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('trips', { method: 'POST', body: { passengers: 2 } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ passengers: 2 }))
  })

  it('throws a TripServicesApiError carrying the API message and status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          { message: 'Trip not found', code: 'NOT_FOUND' },
          { status: 404, statusText: 'Not Found' },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('trips/missing')).rejects.toMatchObject({
      name: 'TripServicesApiError',
      status: 404,
      message: 'Trip not found',
      code: 'NOT_FOUND',
    })
  })

  it('wraps network failures in a TripServicesApiError', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('network down'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('trips')).rejects.toBeInstanceOf(TripServicesApiError)
  })
})
