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

import express from 'express'
import axios from 'axios'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Upstream targets — server-side only, never exposed to the browser
const AUTH_TARGET = process.env.TP_AUTH_URL || 'https://auth.pp.travelport.net'
const API_TARGET  = process.env.TP_API_URL  || 'https://api.pp.travelport.net'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Proxy: OAuth token endpoint ──────────────────────────────────────────────
// Browser calls POST /tp-auth/oauth/token
// Server forwards to https://auth.pp.travelport.net/oauth/token
app.post('/tp-auth/oauth/token', async (req, res) => {
  try {
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
// Server strips the /tp-api prefix, re-cases XAUTH header, forwards upstream
app.all('/tp-api/*', async (req, res) => {
  const upstreamPath = req.path.replace(/^\/tp-api/, '')
  const url = `${API_TARGET}${upstreamPath}`

  const forwardHeaders = {
    'Content-Type':   req.headers['content-type']  || 'application/json',
    'Accept':         req.headers['accept']         || 'application/json',
    'Authorization':  req.headers['authorization']  || '',
    // Re-case the access group header — browsers lowercase custom headers,
    // Travelport gateway is case-sensitive and requires uppercase.
    'XAUTH_TRAVELPORT_ACCESSGROUP': (
      req.headers['xauth_travelport_accessgroup'] ||
      req.headers['XAUTH_TRAVELPORT_ACCESSGROUP'] ||
      ''
    ),
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Version':  req.headers['accept-version']  || '',
    'Content-Version': req.headers['content-version'] || '',
  }

  // Remove empty headers
  Object.keys(forwardHeaders).forEach(key => {
    if (!forwardHeaders[key]) delete forwardHeaders[key]
  })

  try {
    const response = await axios({
      method:         req.method,
      url,
      headers:        forwardHeaders,
      data:           req.method !== 'GET' ? req.body : undefined,
      params:         req.query,
      decompress:     true,
      validateStatus: () => true,
    })

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
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback — all non-API routes serve index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`SPC server running on port ${PORT}`)
  console.log(`Auth proxy → ${AUTH_TARGET}`)
  console.log(`API proxy  → ${API_TARGET}`)
})