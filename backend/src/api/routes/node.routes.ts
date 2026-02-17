import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { nodeRegistry } from '../../nodes/NodeRegistry';

const router = Router();

router.use(authenticate);

// Get all available node types
router.get('/', (_, res) => {
  const nodes = nodeRegistry.getAllNodes();
  res.json({ nodes });
});

// Get node categories
router.get('/categories', (_, res) => {
  const categories = nodeRegistry.getCategories();
  res.json({ categories });
});

export default router;
