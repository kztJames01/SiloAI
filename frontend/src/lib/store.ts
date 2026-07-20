import { create } from 'zustand';
import { authApi } from './api';
import { clearToken, getToken, migrateTokenFromLocalStorage, setToken } from './tokenStorage';

export type UserRole = 'field' | 'admin';

export function dbRoleToUi(role?: string | null): UserRole {
  return role === 'ADMIN' ? 'admin' : 'field';
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

migrateTokenFromLocalStorage();

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user, token } = response.data;
    setToken(token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (email: string, password: string, name?: string) => {
    const response = await authApi.register({ email, password, name });
    const { user, token } = response.data;
    setToken(token);
    set({ user, token, isAuthenticated: true });
  },

  loginWithToken: async (token: string) => {
    setToken(token);
    const response = await authApi.me();
    set({
      user: response.data.user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    clearToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authApi.me();
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      clearToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

interface UiState {
  isMaskingEnabled: boolean;
  sidebarOpen: boolean;
  isDark: boolean;
  toggleMasking: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDark: () => void;
}

const getInitialMasking = (): boolean =>
  localStorage.getItem('ui_mask_sensitive') === 'true';

const getInitialSidebarOpen = (): boolean =>
  localStorage.getItem('ui_sidebar_open') !== 'false';

const getInitialDark = (): boolean =>
  localStorage.getItem('ui_dark') !== 'false';

export const useUiStore = create<UiState>((set) => ({
  isMaskingEnabled: getInitialMasking(),
  sidebarOpen: getInitialSidebarOpen(),
  isDark: getInitialDark(),

  toggleMasking: () =>
    set((state) => {
      const nextValue = !state.isMaskingEnabled;
      localStorage.setItem('ui_mask_sensitive', String(nextValue));
      return { isMaskingEnabled: nextValue };
    }),

  setSidebarOpen: (open: boolean) => {
    localStorage.setItem('ui_sidebar_open', String(open));
    set({ sidebarOpen: open });
  },

  toggleDark: () =>
    set((state) => {
      const next = !state.isDark;
      localStorage.setItem('ui_dark', String(next));
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');

      const link = document.getElementById('favicon') as HTMLLinkElement | null;
      if (link) {
        link.href = next ? '/brand/yellowLogo.svg' : '/brand/blueLogo.svg';
      }

      return { isDark: next };
    }),
}));
