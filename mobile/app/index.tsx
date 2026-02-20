import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createMobileAuthApi, DEFAULT_API_BASE_URL } from '../src/lib/auth';
import { createMobileWorkflowApi } from '../src/lib/workflow';
import { AuthUser, Workflow } from '../../shared/src/types';

const TOKEN_KEY = 'silo.mobile.token';

export default function HomeScreen() {
  const authApi = useMemo(() => createMobileAuthApi(DEFAULT_API_BASE_URL), []);

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const getWorkflowApi = (authToken: string | null) =>
    createMobileWorkflowApi(() => authToken);

  const loadAuthenticatedData = async (authToken: string) => {
    const workflowApi = getWorkflowApi(authToken);
    const [meData, workflowsData] = await Promise.all([
      authApi.me(authToken),
      workflowApi.list(),
    ]);

    setUser(meData.user);
    setWorkflows(workflowsData.workflows);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (!storedToken) {
          setLoading(false);
          return;
        }

        setToken(storedToken);
        await loadAuthenticatedData(storedToken);
      } catch (bootstrapError: any) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setWorkflows([]);
        setError(bootstrapError?.message || 'Failed to restore session');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleAuth = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response =
        authMode === 'register'
          ? await authApi.register({ email, password, name: name || undefined })
          : await authApi.login({ email, password });

      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);

      const workflowApi = getWorkflowApi(response.token);
      const workflowData = await workflowApi.list();
      setWorkflows(workflowData.workflows);

      setPassword('');
    } catch (authError: any) {
      setError(authError?.response?.data?.error || authError?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setWorkflows([]);
    setPassword('');
  };

  const refreshWorkflows = async () => {
    if (!token) return;

    setSubmitting(true);
    setError(null);
    try {
      const workflowApi = getWorkflowApi(token);
      const workflowData = await workflowApi.list();
      setWorkflows(workflowData.workflows);
    } catch (listError: any) {
      setError(listError?.response?.data?.error || listError?.message || 'Failed to load workflows');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Loading Silo Mobile...</Text>
      </SafeAreaView>
    );
  }

  if (!token || !user) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text style={{ fontSize: 26, fontWeight: '700', marginBottom: 8 }}>Silo Mobile</Text>
        <Text style={{ color: '#4B5563', marginBottom: 20 }}>
          {authMode === 'login' ? 'Sign in to manage workflows' : 'Create account to start automations'}
        </Text>

        {authMode === 'register' && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            autoCapitalize="words"
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 12,
            }}
          />
        )}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 12,
          }}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 16,
          }}
        />

        {error && <Text style={{ color: '#B91C1C', marginBottom: 12 }}>{error}</Text>}

        <Button
          title={submitting ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Register'}
          onPress={handleAuth}
          disabled={submitting || !email || !password}
        />

        <TouchableOpacity
          onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          style={{ marginTop: 14 }}
        >
          <Text style={{ color: '#2563EB', textAlign: 'center' }}>
            {authMode === 'login'
              ? 'No account? Register'
              : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>

        <Text style={{ marginTop: 16, color: '#6B7280', textAlign: 'center' }}>
          API: {DEFAULT_API_BASE_URL}
        </Text>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Welcome, {user.name || user.email}</Text>
        <Text style={{ color: '#6B7280', marginTop: 4 }}>Your workflows</Text>
      </View>

      {error && <Text style={{ color: '#B91C1C', marginBottom: 10 }}>{error}</Text>}

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Button title={submitting ? 'Refreshing...' : 'Refresh'} onPress={refreshWorkflows} disabled={submitting} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Logout" onPress={handleLogout} color="#6B7280" />
        </View>
      </View>

      <FlatList
        data={workflows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              backgroundColor: '#FFFFFF',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
            {item.description && (
              <Text style={{ color: '#4B5563', marginTop: 4 }}>{item.description}</Text>
            )}
            <Text style={{ marginTop: 8, color: item.isActive ? '#047857' : '#6B7280' }}>
              {item.isActive ? 'Active' : 'Inactive'} • Nodes: {item.nodes?.length || 0}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: 30 }}>
            <Text style={{ textAlign: 'center', color: '#6B7280' }}>No workflows found.</Text>
          </View>
        }
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
