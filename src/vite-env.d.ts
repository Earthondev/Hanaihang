/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEBAPP_URL: string
  readonly VITE_API_KEY: string
  readonly VITE_SHARED_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
