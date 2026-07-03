import { api } from './api';
import { ApiResponse, AuthTokens } from '../types/api';

export const authService = {
  async login(phone: string, idToken: string): Promise<AuthTokens> {
    const res = await api.post<ApiResponse<AuthTokens>>('/auth/login', { phone, id_token: idToken });
    return res.data.data;
  },

  async devLogin(phone: string, name: string): Promise<AuthTokens> {
    const res = await api.post<ApiResponse<AuthTokens>>('/auth/dev-login', { phone, name });
    return res.data.data;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refresh_token: refreshToken });
    return res.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async registerDevice(fcmToken: string, deviceInfo: string): Promise<void> {
    await api.post('/auth/register-device', { fcm_token: fcmToken, device_info: deviceInfo });
  },
};
