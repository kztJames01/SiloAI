import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.key.slice(0, 8) + '...',
      lastUsed: k.lastUsed,
      createdAt: k.createdAt,
    })),
  });
});

router.post('/', async (req: AuthRequest, res) => {
  const name = String(req.body?.name || 'Default key').trim();
  if (!name) throw new AppError('Key name is required', 400);

  const raw = `sk_${crypto.randomBytes(24).toString('hex')}`;
  const key = await prisma.apiKey.create({
    data: {
      userId: req.userId!,
      name,
      key: raw,
    },
  });

  res.status(201).json({
    key: {
      id: key.id,
      name: key.name,
      secret: raw,
      createdAt: key.createdAt,
    },
  });
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const deleted = await prisma.apiKey.deleteMany({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!deleted.count) throw new AppError('API key not found', 404);
  res.json({ success: true });
});

export default router;
