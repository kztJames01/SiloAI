import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  message: 'Too many auth attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// per logged-in user, not IP. in-memory so it resets on restart / doesn't share across instances
export const llmRateLimiter = rateLimit({
  windowMs: parseInt(process.env.LLM_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.LLM_RATE_LIMIT_MAX || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, try again later.' },
  keyGenerator: (req: any) => (req.userId ? `u:${req.userId}` : req.ip || 'anon'),
  validate: false,
});
