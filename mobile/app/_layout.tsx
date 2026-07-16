import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(marketing)/help" options={{ headerShown: true, title: 'Help Center' }} />
            <Stack.Screen name="(marketing)/contact" options={{ headerShown: true, title: 'Contact Us' }} />
            <Stack.Screen name="(marketing)/privacy" options={{ headerShown: true, title: 'Privacy Policy' }} />
            <Stack.Screen name="workflow/[id]" options={{ headerShown: true, title: 'Workflow' }} />
            <Stack.Screen name="execution/[id]" options={{ headerShown: true, title: 'Execution' }} />
            <Stack.Screen name="integrations/index" options={{ headerShown: true, title: 'Apps' }} />
            <Stack.Screen name="integrations/[provider]" options={{ headerShown: true, title: 'Integration' }} />
            <Stack.Screen name="agents/index" options={{ headerShown: true, title: 'Agents' }} />
            <Stack.Screen name="agents/[id]" options={{ headerShown: true, title: 'Agent' }} />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
