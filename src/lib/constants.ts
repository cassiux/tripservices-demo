/**
 * Application-wide constants for Smartpoint Cloud (SPC).
 *
 * Declare shared values here using SCREAMING_SNAKE_CASE (e.g. TripServices
 * endpoint paths, default cabin/currency, queue categories, feature flags).
 * Environment-specific values belong in .env.local (import.meta.env.VITE_*),
 * never here.
 */

/** Client-side route paths. */
export const ROUTES = {
  QUEUES: '/queues',
  SEARCH: '/search',
  TRIPS: '/trips',
  PROFILES: '/profiles',
} as const

/**
 * HTTP header names for TripServices agency context.
 *
 * CONFIRM the exact header keys (and whether PCC / access group belong in headers
 * or the request payload) against the TripServices OpenAPI spec before production.
 * These are best-effort names for the pre-production sandbox.
 */
export const TRIPSERVICES_HEADERS = {
  PCC: 'PCC',
  ACCESS_GROUP: 'Access-Group',
} as const
