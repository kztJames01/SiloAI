import { randomBytes } from 'crypto';
import prisma from '../db/prisma';

export async function ensureOrg(userId: string) {
  const existing = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { org: true },
  });
  if (existing) return existing.org;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const name = user?.name ? `${user.name}'s workspace` : 'My workspace';

  const org = await prisma.organization.create({
    data: {
      name,
      ownerId: userId,
      members: {
        create: { userId, role: 'OWNER' },
      },
    },
  });
  return org;
}

export async function getOrgUserIds(userId: string) {
  const org = await ensureOrg(userId);
  const members = await prisma.organizationMember.findMany({
    where: { orgId: org.id },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

export async function getMembership(userId: string) {
  const org = await ensureOrg(userId);
  const member = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: org.id, userId } },
  });
  return { org, member };
}

export function makeInviteToken() {
  return randomBytes(24).toString('hex');
}
