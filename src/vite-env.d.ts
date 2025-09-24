/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string
  readonly VITE_VAPID_PUBLIC_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_ANALYTICS_ID: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_PWA: string
  readonly VITE_ENABLE_REAL_TIME: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_LOG_LEVEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
