import { Router } from 'express';
import { getMetricsSnapshot, getPrometheusMetrics } from '../../monitoring/metrics';

const router = Router();

function checkMetricsAuth(req: any, res: any) {
  const token = process.env.METRICS_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Metrics disabled — set METRICS_TOKEN' });
      return false;
    }
    return true;
  }

  const header = req.headers.authorization || '';
  if (header === `Bearer ${token}`) return true;

  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

router.get('/', (req, res) => {
  if (!checkMetricsAuth(req, res)) return;
  res.json(getMetricsSnapshot());
});

router.get('/prometheus', (req, res) => {
  if (!checkMetricsAuth(req, res)) return;
  res.type('text/plain').send(getPrometheusMetrics());
});

export default router;
