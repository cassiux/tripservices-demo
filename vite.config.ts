import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * Dev-server proxy targets for the TripServices sandbox.
 *
 * The browser calls same-origin paths (`/tp-auth`, `/tp-api`) which the Vite dev
 * server forwards server-side to Travelport. This sidesteps browser CORS on the
 * token + API calls and keeps the sandbox client secret out of cross-origin
 * requests. The app's own URLs (`VITE_TRIPSERVICES_AUTH_URL` / `_BASE_URL`) point
 * at these proxy paths in dev; the real upstreams are read from the env below.
 */
const DEFAULT_AUTH_TARGET = 'https://auth.pp.travelport.net'
const DEFAULT_API_TARGET = 'https://api.pp.travelport.net'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const authTarget = env.VITE_DEV_AUTH_TARGET || DEFAULT_AUTH_TARGET
  const apiTarget = env.VITE_DEV_API_TARGET || DEFAULT_API_TARGET

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        // OAuth token endpoint: /tp-auth/oauth/token -> {authTarget}/oauth/token
        '/tp-auth': {
          target: authTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tp-auth/, ''),
        },
        // TripServices API: /tp-api/<path> -> {apiTarget}/<path>
        // The `configure` block re-cases the access-group header before the
        // request leaves Node. Browsers lowercase all fetch header names, but
        // the Travelport API gateway is case-sensitive and requires the header
        // in uppercase: XAUTH_TRAVELPORT_ACCESSGROUP.
        '/tp-api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tp-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const val = req.headers['xauth_travelport_accessgroup']
              if (val) {
                proxyReq.removeHeader('xauth_travelport_accessgroup')
                proxyReq.setHeader(
                  'XAUTH_TRAVELPORT_ACCESSGROUP',
                  Array.isArray(val) ? val[0] : val
                )
              }
            })
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      // E2E specs are run by Playwright, not Vitest.
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    },
  }
})