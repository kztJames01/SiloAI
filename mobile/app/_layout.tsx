import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack />
    </ThemeProvider>
  );
}
