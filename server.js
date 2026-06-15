/**
 * Production server for Railway deployment.
 *
 * Does two things:
 * 1. Serves the Vite production build from /dist
 * 2. Proxies TripServices API calls server-side to avoid CORS and
 *    keep credentials out of the browser
 *
 * Proxy routes mirror the Vite dev-server proxy in vite.config.ts:
 *   /tp-auth/* → https://auth.pp.travelport.net/*
 *   /tp-api/*  → https://api.pp.travelport.net/*
 *
 * Railway environment variables required (set in Railway dashboard):
 *   TP_AUTH_URL   = https://auth.pp.travelport.net
 *   TP_API_URL    = https://api.pp.travelport.net
 *   PORT          = (set automatically by Railway)
 */

const express = require('express')
const axios = require('axios')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// Upstream targets — read from server-side env vars (not VITE_ prefixed)
const AUTH_TARGET = process.env.TP_AUTH_URL || 'https://auth.pp.travelport.net'
const API_TARGET  = process.env.TP_API_URL  || 'https://api.pp.travelport.net'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Proxy: OAuth token endpoint ──────────────────────────────────────────────
// Browser calls POST /tp-auth/oauth/token
// Server forwards to https://auth.pp.travelport.net/oauth/token
app.post('/tp-auth/oauth/token', async (req, res) => {
  try {
    // Body arrives as JSON from the browser fetch — convert to form-urlencoded
    // exactly as the Travelport auth endpoint requires.
    const params = new URLSearchParams()
    const fields = ['grant_type', 'username', 'password', 'client_id', 'client_secret', 'scope']
    fields.forEach(field => {
      if (req.body[field] !== undefined) params.append(field, req.body[field])
    })

    const response = await axios.post(
      `${AUTH_TARGET}/oauth/token`,
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    res.json(response.data)
  } catch (err) {
    const status = err.response?.status || 500
    const data   = err.response?.data   || { error: err.message }
    console.error('[tp-auth] error:', status, data)
    res.status(status).json(data)
  }
})

// ── Proxy: TripServices API ──────────────────────────────────────────────────
// Browser calls /tp-api/<path> with standard headers
// Server strips the /tp-api prefix, adds XAUTH header in correct casing,
// and forwards to https://api.pp.travelport.net/<path>
app.all('/tp-api/*', async (req, res) => {
  const upstreamPath = req.path.replace(/^\/tp-api/, '')
  const url = `${API_TARGET}${upstreamPath}`

  // Copy safe headers from the browser request
  const forwardHeaders = {
    'Content-Type':               req.headers['content-type']               || 'application/json',
    'Accept':                     req.headers['accept']                     || 'application/json',
    'Authorization':              req.headers['authorization']              || '',
    // Re-case the access group header — browsers lowercase custom headers,
    // Travelport gateway is case-sensitive and requires uppercase.
    'XAUTH_TRAVELPORT_ACCESSGROUP': (
      req.headers['xauth_travelport_accessgroup'] ||
      req.headers['XAUTH_TRAVELPORT_ACCESSGROUP'] ||
      ''
    ),
    'Accept-Encoding':  'gzip, deflate',
    'Accept-Version':   req.headers['accept-version']   || '',
    'Content-Version':  req.headers['content-version']  || '',
  }

  // Remove empty headers
  Object.keys(forwardHeaders).forEach(key => {
    if (!forwardHeaders[key]) delete forwardHeaders[key]
  })

  try {
    const response = await axios({
      method:          req.method,
      url,
      headers:         forwardHeaders,
      data:            req.method !== 'GET' ? req.body : undefined,
      params:          req.query,
      decompress:      true,
      validateStatus:  () => true, // pass all status codes through
    })

    // Forward response headers and status
    res.status(response.status)
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type'])
    }
    res.json(response.data)
  } catch (err) {
    const status = err.response?.status || 500
    const data   = err.response?.data   || { error: err.message }
    console.error('[tp-api]', req.method, upstreamPath, status, data)
    res.status(status).json(data)
  }
})

// ── Serve Vite production build ──────────────────────────────────────────────
// Must come after proxy routes so /tp-auth and /tp-api are intercepted first
app.use(express.static(path.join(__dirname, 'dist')))

// SPA fallback — serve index.html for all non-API routes
// so React Router handles client-side navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`SPC server running on port ${PORT}`)
  console.log(`Auth proxy → ${AUTH_TARGET}`)
  console.log(`API proxy  → ${API_TARGET}`)
})