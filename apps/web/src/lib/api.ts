import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401 && useAuthStore.getState().token) {
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

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  [key: string]: unknown;
}

/** Helpers tipados: la API envuelve todo en { success, data, meta? } */
export const get = async <T>(url: string, params?: Record<string, unknown>) => {
  const { data } = await api.get(url, { params: clean(params) });
  return data.data as T;
};
export const list = async <T>(url: string, params?: ListParams) => {
  const { data } = await api.get(url, { params: clean(params) });
  return { data: data.data as T[], meta: data.meta } as Paginated<T>;
};
export const post = async <T>(url: string, body?: unknown) => {
  const { data } = await api.post(url, body);
  return data.data as T;
};
export const patch = async <T>(url: string, body?: unknown) => {
  const { data } = await api.patch(url, body);
  return data.data as T;
};
export const put = async <T>(url: string, body?: unknown) => {
  const { data } = await api.put(url, body);
  return data.data as T;
};
export const del = async <T = { id: string }>(url: string) => {
  const { data } = await api.delete(url);
  return data.data as T;
};

const clean = (params?: Record<string, unknown>) => {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
};
