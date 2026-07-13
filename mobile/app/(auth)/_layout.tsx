import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function AuthLayout() {
  const { token } = useAuth();
  if (token) return <Redirect href={'/(tabs)/field' as any} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
