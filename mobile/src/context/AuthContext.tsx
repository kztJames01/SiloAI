import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthUser, LoginPayload, RegisterPayload } from '../../../shared/src/types';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createMobileAuthApi, DEFAULT_API_BASE_URL } from '../lib/auth';
import { getSecureItem, removeSecureItem, setSecureItem } from '../lib/secureStorage';
import { registerPushToken, unregisterPushToken } from '../lib/push';

const TOKEN_KEY = 'silo.mobile.token';
const LEGACY_TOKEN_KEY = TOKEN_KEY; // same key was previously stored in AsyncStorage

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (data: LoginPayload) => Promise<AuthUser>;
  register: (data: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'apple') => Promise<AuthUser>;
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
        let saved = await getSecureItem(TOKEN_KEY);

        // One-time migration: earlier builds stored the JWT in plain AsyncStorage.
        if (!saved) {
          const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
          if (legacy) {
            saved = legacy;
            await setSecureItem(TOKEN_KEY, legacy);
          }
        }
        await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);

        if (!saved) return;
        const data = await api.me(saved);
        setToken(saved);
        setUser(data.user);
        registerPushToken(saved).catch(() => {});
      } catch {
        await removeSecureItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, [api]);

  const saveSession = async (nextToken: string, nextUser: AuthUser) => {
    await setSecureItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    registerPushToken(nextToken).catch(() => {});
  };

  const login = async (data: LoginPayload) => {
    const response = await api.login(data);
    await saveSession(response.token, response.user);
    return response.user;
  };

  const register = async (data: RegisterPayload) => {
    const response = await api.register(data);
    await saveSession(response.token, response.user);
    return response.user;
  };

  const logout = async () => {
    if (token) await unregisterPushToken(token).catch(() => {});
    await removeSecureItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const response = await api.me(token);
    setUser(response.user);
  };

  // Note: the backend redirects back using the fixed "silomobile://" scheme
  // registered in app.json, not whatever Linking.createURL() resolves to. That
  // means this flow completes automatically in a dev-client/standalone build,
  // but not in plain Expo Go (which uses its own exp:// scheme and can't be
  // deep-linked into from an arbitrary custom scheme).
  const loginWithOAuth = async (provider: 'google' | 'apple') => {
    const redirectUrl = Linking.createURL('oauth-callback');
    const authUrl = `${DEFAULT_API_BASE_URL}/api/auth/oauth/${provider}/start?mode=login&platform=mobile`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
    if (result.type !== 'success' || !result.url) {
      if (result.type === 'dismiss' || result.type === 'cancel') {
        throw new Error('Sign in cancelled');
      }
      throw new Error(`Could not sign in with ${provider}`);
    }

    const parsed = Linking.parse(result.url);
    const oauthCode = parsed.queryParams?.code;
    const oauthError = parsed.queryParams?.error;

    if (oauthError) throw new Error(String(oauthError));
    if (!oauthCode || typeof oauthCode !== 'string') {
      throw new Error(`${provider} sign-in did not return a code`);
    }

    const response = await api.exchangeOAuthCode(oauthCode);
    await saveSession(response.token, response.user);
    return response.user;
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, register, logout, refreshUser, loginWithOAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
