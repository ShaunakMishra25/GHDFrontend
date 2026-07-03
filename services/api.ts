import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { ApiResponse, PaginatedResponse } from '../types/api';

const BASE_URL = __DEV__
  ? 'http://192.168.1.100:8080/api/v1'
  : 'https://gumla-hds-api.up.railway.app/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      const refreshed = await useAuthStore.getState().refreshToken();
      if (refreshed && error.config) {
        error.config.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
        return api.request(error.config);
      }
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export async function getPaginated<T>(
  url: string,
  params?: { limit?: number; offset?: number },
): Promise<{ data: T[]; total: number }> {
  const res = await api.get<PaginatedResponse<T>>(url, { params });
  return { data: res.data.data, total: res.data.pagination.total };
}
