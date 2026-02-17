import { Router } from 'express';
import prisma from '../../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Get all available integrations
router.get('/', async (_req: AuthRequest, res) => {
  const integrations = await prisma.integration.findMany({
    orderBy: { name: 'asc' },
  });

  res.json({ integrations });
});

// Get user's configured integrations
router.get('/user', async (req: AuthRequest, res) => {
  const userIntegrations = await prisma.userIntegration.findMany({
    where: { userId: req.userId },
    include: {
      integration: true,
    },
  });

  res.json({ userIntegrations });
});

export default router;
