/// <reference types="vite/client" />

interface ImportMetaEnv {
  /* TripServices API (Travelport). */
  readonly VITE_TRIPSERVICES_BASE_URL: string
  readonly VITE_TRIPSERVICES_AUTH_URL: string
  readonly VITE_TRIPSERVICES_CLIENT_ID: string
  readonly VITE_TRIPSERVICES_CLIENT_SECRET: string
  readonly VITE_TRIPSERVICES_USERNAME: string
  readonly VITE_TRIPSERVICES_PASSWORD: string
  readonly VITE_TRIPSERVICES_PCC: string
  readonly VITE_TRIPSERVICES_ACCESS_GROUP: string
  readonly VITE_TRIPSERVICES_REGION: string
  readonly VITE_DEFAULT_CURRENCY: string

  /* Okta SSO (production auth). */
  readonly VITE_OKTA_ISSUER: string
  readonly VITE_OKTA_CLIENT_ID: string
  readonly VITE_OKTA_REDIRECT_URI: string

  readonly VITE_ENV: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
