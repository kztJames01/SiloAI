import prisma from '../db/prisma'

const MAX_TURNS = 12

export function agentConversationId(agentId: string, userId: string) {
  return `agent:${agentId}:user:${userId}`
}

export async function loadAgentMemory(agentId: string, userId: string): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const conversationId = agentConversationId(agentId, userId)
  const row = await prisma.aIContext.findUnique({ where: { conversationId } })
  if (!row) return []
  const messages = Array.isArray(row.messages) ? row.messages : []
  return messages
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
    .slice(-MAX_TURNS)
}

export async function saveAgentMemory(
  agentId: string,
  userId: string,
  userText: string,
  assistantText: string
) {
  const conversationId = agentConversationId(agentId, userId)
  const existing = await prisma.aIContext.findUnique({ where: { conversationId } })
  const prev = Array.isArray(existing?.messages) ? existing!.messages as any[] : []
  const next = [
    ...prev.filter((m) => m && m.role !== 'system'),
    { role: 'user', content: String(userText).slice(0, 8000) },
    { role: 'assistant', content: String(assistantText).slice(0, 8000) },
  ].slice(-MAX_TURNS)

  await prisma.aIContext.upsert({
    where: { conversationId },
    create: {
      conversationId,
      userId,
      messages: next,
      variables: { agentId },
    },
    update: {
      messages: next,
      lastAccessedAt: new Date(),
    },
  })
}
