import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser, LoginPayload, RegisterPayload } from '../../../shared/src/types';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createMobileAuthApi, DEFAULT_API_BASE_URL } from '../lib/auth';

const TOKEN_KEY = 'silo.mobile.token';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo(() => createMobileAuthApi(DEFAULT_API_BASE_URL), []);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (!saved) return;
        const data = await api.me(saved);
        setToken(saved);
        setUser(data.user);
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, [api]);

  const saveSession = async (nextToken: string, nextUser: AuthUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async (data: LoginPayload) => {
    const response = await api.login(data);
    await saveSession(response.token, response.user);
  };

  const register = async (data: RegisterPayload) => {
    const response = await api.register(data);
    await saveSession(response.token, response.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const response = await api.me(token);
    setUser(response.user);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
