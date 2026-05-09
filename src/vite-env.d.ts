/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override CRM origin (default https://unit-control.ru). Used in dev and prod. */
  readonly VITE_CRM_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
