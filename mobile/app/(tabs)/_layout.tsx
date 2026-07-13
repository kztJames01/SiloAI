import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';

const icon = (symbol: string, color: string) => <Text style={{ color, fontSize: 19 }}>{symbol}</Text>;

export default function TabsLayout() {
  const { token, loading } = useAuth();
  const { colors } = useTheme();

  if (!loading && !token) return <Redirect href={'/(auth)/login' as any} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: 6 },
      }}
    >
      <Tabs.Screen name="field" options={{ title: 'Field', tabBarIcon: ({ color }) => icon('⚡', color) }} />
      <Tabs.Screen name="workflows" options={{ title: 'Workflows', tabBarIcon: ({ color }) => icon('◇', color) }} />
      <Tabs.Screen name="executions" options={{ title: 'Runs', tabBarIcon: ({ color }) => icon('◷', color) }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => icon('●', color) }} />
    </Tabs>
  );
}
