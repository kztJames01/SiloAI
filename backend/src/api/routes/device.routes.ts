import { Router } from 'express'
import { z } from 'zod'
import prisma from '../../db/prisma'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import { AppError } from '../middleware/error.middleware'
import { looksLikeExpoToken } from '../../services/pushNotify'

const router = Router()
router.use(authenticate)

router.post('/push-token', async (req: AuthRequest, res) => {
  const { token, platform } = z.object({
    token: z.string().min(10).max(200),
    platform: z.enum(['ios', 'android', 'web']).optional(),
  }).parse(req.body)

  if (!looksLikeExpoToken(token)) {
    throw new AppError('Invalid push token', 400)
  }

  await prisma.devicePushToken.upsert({
    where: { token },
    create: { userId: req.userId!, token, platform },
    update: { userId: req.userId!, platform: platform || undefined },
  })

  res.json({ ok: true })
})

router.delete('/push-token', async (req: AuthRequest, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : undefined
  if (token) {
    await prisma.devicePushToken.deleteMany({ where: { userId: req.userId!, token } })
  } else {
    await prisma.devicePushToken.deleteMany({ where: { userId: req.userId! } })
  }
  res.json({ ok: true })
})

export default router
