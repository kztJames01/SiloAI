import { create } from 'zustand';
import { authApi } from './api';

export type UserRole = 'field' | 'admin';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (email: string, password: string, name?: string) => {
    const response = await authApi.register({ email, password, name });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
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
  role: UserRole;
  isMaskingEnabled: boolean;
  sidebarOpen: boolean;
  isDark: boolean;
  setRole: (role: UserRole) => void;
  toggleMasking: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDark: () => void;
}

const getInitialRole = (): UserRole =>
  (localStorage.getItem('ui_role') as UserRole) || 'admin';

const getInitialMasking = (): boolean =>
  localStorage.getItem('ui_mask_sensitive') === 'true';

const getInitialSidebarOpen = (): boolean =>
  localStorage.getItem('ui_sidebar_open') !== 'false';

// Default to dark mode unless user has explicitly set light
const getInitialDark = (): boolean =>
  localStorage.getItem('ui_dark') !== 'false';

export const useUiStore = create<UiState>((set) => ({
  role: getInitialRole(),
  isMaskingEnabled: getInitialMasking(),
  sidebarOpen: getInitialSidebarOpen(),
  isDark: getInitialDark(),

  setRole: (role: UserRole) => {
    localStorage.setItem('ui_role', role);
    set({ role });
  },

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
      return { isDark: next };
    }),
}));
