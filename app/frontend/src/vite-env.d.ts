/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do backend. Sem ela, o app roda com dados simulados. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
