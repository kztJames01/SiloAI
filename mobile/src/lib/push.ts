import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { createApiClient } from '../../../shared/src/api/client'
import { DEFAULT_API_BASE_URL } from './auth'

function projectId() {
  return (
    Constants.easConfig?.projectId ||
    (Constants.expoConfig as any)?.extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    ''
  )
}

export async function registerPushToken(authToken: string) {
  try {
    const Notifications = await import('expo-notifications')
    const Device = await import('expo-device')
    if (!Device.isDevice) return
    const pid = projectId()
    if (!pid) return

    const existing = await Notifications.getPermissionsAsync()
    let status = existing.status
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync()
      status = asked.status
    }
    if (status !== 'granted') return

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    const expo = await Notifications.getExpoPushTokenAsync({ projectId: pid })
    const token = expo.data
    if (!token || !token.startsWith('ExponentPushToken[')) return

    const client = createApiClient(DEFAULT_API_BASE_URL)
    await client.request('/api/devices/push-token', {
      method: 'POST',
      token: authToken,
      body: { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' },
    })
  } catch {
    // expo go / missing native module
  }
}

export async function unregisterPushToken(authToken: string) {
  try {
    const client = createApiClient(DEFAULT_API_BASE_URL)
    await client.request('/api/devices/push-token', {
      method: 'DELETE',
      token: authToken,
    })
  } catch {
    // ignore
  }
}

export function listenForPushTap(onExecution: (id: string) => void) {
  let sub: { remove: () => void } | null = null
  import('expo-notifications')
    .then((Notifications) => {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        })
      } catch {
        // ignore
      }
      sub = Notifications.addNotificationResponseReceivedListener((res) => {
        const data = res.notification.request.content.data as any
        const id = data?.executionId
        if (id) onExecution(String(id))
      })
    })
    .catch(() => {})
  return () => {
    sub?.remove()
  }
}
