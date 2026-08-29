import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store isn't available on web, fall back to localStorage there
// (web build is dev/demo only, not a real deployment target for this app).
const isWeb = Platform.OS === 'web';

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removeSecureItem(key: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
