import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { getMembership, makeInviteToken } from '../../services/org';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  const { org, member } = await getMembership(req.userId!);
  const members = await prisma.organizationMember.findMany({
    where: { orgId: org.id },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const invites = await prisma.organizationInvite.findMany({
    where: { orgId: org.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    org,
    me: member,
    members,
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
      token: member?.role === 'OWNER' || member?.role === 'ADMIN' ? i.token : undefined,
    })),
  });
});

router.patch('/', requireAdmin, async (req: AuthRequest, res) => {
  const { name } = z.object({ name: z.string().min(1).max(80) }).parse(req.body);
  const { org, member } = await getMembership(req.userId!);
  if (member?.role !== 'OWNER' && member?.role !== 'ADMIN') {
    throw new AppError('Only owners and admins can rename the org', 403);
  }
  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: { name },
  });
  res.json({ org: updated });
});

router.post('/invite', requireAdmin, async (req: AuthRequest, res) => {
  const { email, role } = z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER', 'FIELD']).default('MEMBER'),
  }).parse(req.body);

  const { org, member } = await getMembership(req.userId!);
  if (member?.role !== 'OWNER' && member?.role !== 'ADMIN') {
    throw new AppError('Only owners and admins can invite', 403);
  }

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    const already = await prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: org.id, userId: existingUser.id } },
    });
    if (already) throw new AppError('That user is already in the org', 400);
  }

  const invite = await prisma.organizationInvite.create({
    data: {
      orgId: org.id,
      email: email.toLowerCase(),
      role,
      token: makeInviteToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      invitedBy: req.userId!,
    },
  });

  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.status(201).json({
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      token: invite.token,
      url: `${frontend}/invite/${invite.token}`,
    },
  });
});

router.get('/invite/:token', async (req: AuthRequest, res) => {
  const invite = await prisma.organizationInvite.findUnique({
    where: { token: req.params.token },
    include: { org: { select: { id: true, name: true } } },
  });
  if (!invite || invite.expiresAt < new Date()) {
    throw new AppError('Invite expired or not found', 404);
  }
  res.json({
    email: invite.email,
    role: invite.role,
    org: invite.org,
  });
});

router.post('/invite/:token/accept', async (req: AuthRequest, res) => {
  const invite = await prisma.organizationInvite.findUnique({
    where: { token: req.params.token },
  });
  if (!invite || invite.expiresAt < new Date()) {
    throw new AppError('Invite expired or not found', 404);
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new AppError('Sign in with the invited email to accept', 403);
  }

  await prisma.organizationMember.upsert({
    where: { orgId_userId: { orgId: invite.orgId, userId: user.id } },
    update: { role: invite.role },
    create: { orgId: invite.orgId, userId: user.id, role: invite.role },
  });

  if (invite.role === 'ADMIN' || invite.role === 'OWNER') {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
  }

  await prisma.organizationInvite.delete({ where: { id: invite.id } });
  const org = await prisma.organization.findUnique({ where: { id: invite.orgId } });
  res.json({ ok: true, org });
});

router.post('/transfer', requireAdmin, async (req: AuthRequest, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.body);
  const { org, member } = await getMembership(req.userId!);
  if (member?.role !== 'OWNER') throw new AppError('Only the owner can transfer', 403);
  if (userId === req.userId) throw new AppError('Already the owner', 400);

  const target = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: org.id, userId } },
  });
  if (!target) throw new AppError('User is not in this org', 404);

  await prisma.$transaction([
    prisma.organization.update({ where: { id: org.id }, data: { ownerId: userId } }),
    prisma.organizationMember.update({
      where: { orgId_userId: { orgId: org.id, userId } },
      data: { role: 'OWNER' },
    }),
    prisma.organizationMember.update({
      where: { orgId_userId: { orgId: org.id, userId: req.userId! } },
      data: { role: 'ADMIN' },
    }),
    prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } }),
  ]);

  res.json({ ok: true });
});

export default router;
