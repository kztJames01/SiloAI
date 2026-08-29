import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../db/prisma';
import { hashApiKey } from '../../utils/security';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: 'ADMIN' | 'FIELD';
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Invalid authorization format' });
      return;
    }

    if (token.startsWith('sk_')) {
      const keyHash = hashApiKey(token);
      const record = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { user: { select: { id: true, email: true, name: true, role: true } } },
      });
      if (!record) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
      }
      await prisma.apiKey.update({
        where: { id: record.id },
        data: { lastUsed: new Date() },
      });
      req.userId = record.user.id;
      req.userRole = record.user.role;
      req.user = record.user;
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    next(error);
  }
};

// Blocks FIELD-role accounts from admin-only mutations (workflow authoring, etc).
// Ownership checks in each route still apply on top of this.
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.userRole !== 'ADMIN') {
    res.status(403).json({ error: 'This action requires an admin account' });
    return;
  }
  next();
};
