import Constants from 'expo-constants';

// When running in Expo Go on a physical device, localhost points at the phone
// itself, not your laptop. Metro/Expo knows the LAN IP it's serving from
// (hostUri), so we reuse that host with the backend port instead of making
// people hardcode EXPO_PUBLIC_API_URL every time they switch wifi networks.
function deriveDevApiUrl(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri) return null;

  const host = String(hostUri).split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;

  const backendPort = process.env.EXPO_PUBLIC_API_PORT || '5000';
  return `http://${host}:${backendPort}`;
}

export function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  if (__DEV__) {
    const derived = deriveDevApiUrl();
    if (derived) return derived;
  }

  return 'http://localhost:5000';
}
