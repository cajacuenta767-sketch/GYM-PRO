import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({ baseURL: API_BASE, timeout: 20_000 });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

/** Renueva el token de acceso una sola vez aunque varias peticiones fallen a la vez. */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const rt = useAuthStore.getState().refreshToken;
    if (!rt) return null;
    try {
      const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: rt });
      useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.accessToken as string;
    } catch {
      useAuthStore.getState().logout();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute && useAuthStore.getState().refreshToken) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    } else if (error.response?.status === 401 && useAuthStore.getState().token && !isAuthRoute) {
      useAuthStore.getState().logout();
    }
    const message =
      (Array.isArray(error.response?.data?.message) ? error.response?.data?.message.join(', ') : error.response?.data?.message) ||
      error.message ||
      'Error de conexión con el servidor';
    return Promise.reject(new ApiError(message, error.response?.status));
  },
);

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Paginated<T> { data: T[]; meta: { total: number; page: number; limit: number; pages: number } }
export interface ListParams { page?: number; limit?: number; search?: string; sortBy?: string; sortDir?: 'asc' | 'desc'; [key: string]: unknown }

export const get = async <T>(url: string, params?: Record<string, unknown>) => { const { data } = await api.get(url, { params: clean(params) }); return data.data as T; };
export const list = async <T>(url: string, params?: ListParams) => { const { data } = await api.get(url, { params: clean(params) }); return { data: data.data as T[], meta: data.meta } as Paginated<T>; };
export const post = async <T>(url: string, body?: unknown) => { const { data } = await api.post(url, body); return data.data as T; };
export const patch = async <T>(url: string, body?: unknown) => { const { data } = await api.patch(url, body); return data.data as T; };
export const put = async <T>(url: string, body?: unknown) => { const { data } = await api.put(url, body); return data.data as T; };
export const del = async <T = { id: string }>(url: string) => { const { data } = await api.delete(url); return data.data as T; };

/** Sube un archivo (multipart) y devuelve la respuesta de la API. */
export const upload = async <T>(url: string, file: File, field = 'file') => {
  const fd = new FormData(); fd.append(field, file);
  const { data } = await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 });
  return data.data as T;
};

/** Descarga un recurso protegido (PDF, CSV) y lo abre o guarda en el navegador. */
export const download = async (url: string, filename?: string, openInTab = false) => {
  const res = await api.get(url, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  if (openInTab) window.open(blobUrl, '_blank');
  else { const a = document.createElement('a'); a.href = blobUrl; a.download = filename ?? 'archivo'; a.click(); }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};

/** Convierte rutas relativas del servidor (/uploads/…) en URL absolutas cuando la API vive en otro origen. */
export const assetUrl = (url?: string | null) => {
  if (!url) return url ?? undefined;
  if (url.startsWith('/uploads/') && /^https?:\/\//.test(API_BASE)) return new URL(API_BASE).origin + url;
  return url;
};

const clean = (params?: Record<string, unknown>) => {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
};
