import prisma from '../db/prisma'
import { logger } from '../utils/logger'

const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send'

export function looksLikeExpoToken(token: string) {
  return typeof token === 'string' && /^ExponentPushToken\[[A-Za-z0-9_-]+\]$/.test(token.trim())
}

export async function notifyFieldRunFinished(executionId: string, status: string) {
  try {
    const action = await prisma.fieldAction.findFirst({
      where: { workflowExecutionId: executionId },
      select: { userId: true, actionType: true },
    })
    if (!action) return

    const tokens = await prisma.devicePushToken.findMany({
      where: { userId: action.userId },
      select: { token: true },
    })
    if (!tokens.length) return

    const title = status === 'SUCCESS' ? 'Field action finished' : 'Field action failed'
    const body = `${action.actionType} is ${status.toLowerCase()}`

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data: { executionId, url: `/execution/${executionId}` },
    }))

    const res = await fetch(EXPO_PUSH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    })
    if (!res.ok) {
      logger.warn('expo push failed', { status: res.status, executionId })
    }
  } catch (err: any) {
    logger.warn('expo push skipped', { executionId, error: err?.message })
  }
}
