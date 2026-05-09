import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { initDataRaw } from '@telegram-apps/sdk-vue';

const DEFAULT_CRM_ORIGIN = 'https://unit-control.ru';

/**
 * API always targets the deployed CRM (remote), including `npm run dev` on localhost.
 * Set `VITE_CRM_API_BASE` to override (e.g. staging). Never use `import.meta.env.BASE_URL` here —
 * that would prefix `/ucminiapp/` and break `/MiniApp/...` paths.
 */
function apiBase(): string {
  const raw = import.meta.env.VITE_CRM_API_BASE as string | undefined;
  if ( raw !== undefined && raw.trim() !== '' )
    return raw.replace( /\/+$/, '' );
  return DEFAULT_CRM_ORIGIN;
}

let instance: AxiosInstance | null = null;

export function getCrmClient(): AxiosInstance {
  if ( instance )
    return instance;

  instance = axios.create( {
    baseURL: apiBase(),
    timeout: 60_000,
    headers: {
      'Content-Type': 'application/json',
    },
  } );

  instance.interceptors.request.use( ( config: InternalAxiosRequestConfig ) => {
    const raw = initDataRaw();
    if ( raw ) {
      const h = config.headers ?? {};
      ( h as Record<string, string> )['X-Telegram-Init-Data'] = raw;
      config.headers = h;
    }
    return config;
  } );

  return instance;
}

export { apiBase };
