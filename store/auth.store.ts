import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { User } from '../types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, name: string) => Promise<void>;
  refreshTokenAction: () => Promise<boolean>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (phone, name) => {
    const tokens = await authService.devLogin(phone, name);
    await AsyncStorage.setItem('access_token', tokens.access_token);
    await AsyncStorage.setItem('refresh_token', tokens.refresh_token);
    await AsyncStorage.setItem('user', JSON.stringify(tokens.user));
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user: tokens.user,
      isAuthenticated: true,
    });
  },

  refreshTokenAction: async () => {
    const currentRefresh = get().refreshToken;
    if (!currentRefresh) return false;
    try {
      const tokens = await authService.refresh(currentRefresh);
      await AsyncStorage.setItem('access_token', tokens.access_token);
      await AsyncStorage.setItem('refresh_token', tokens.refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(tokens.user));
      set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user: tokens.user,
        isAuthenticated: true,
      });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userStr] = await AsyncStorage.multiGet([
        'access_token', 'refresh_token', 'user',
      ]);
      if (accessToken[1] && refreshToken[1] && userStr[1]) {
        set({
          accessToken: accessToken[1],
          refreshToken: refreshToken[1],
          user: JSON.parse(userStr[1]),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
