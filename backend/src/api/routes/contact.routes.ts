import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  source: z.enum(['web', 'mobile']).optional(),
});

router.post('/', async (req, res) => {
  const body = contactSchema.parse(req.body);

  const saved = await prisma.contactMessage.create({
    data: {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      message: body.message.trim(),
      source: body.source || 'web',
    },
  });

  res.status(201).json({ id: saved.id, message: 'Message received' });
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  if (req.userRole !== 'ADMIN') throw new AppError('Admin only', 403);

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json({ messages });
});

export default router;
