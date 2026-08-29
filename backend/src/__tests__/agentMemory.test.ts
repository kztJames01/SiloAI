import { loadAgentMemory, saveAgentMemory, agentConversationId } from '../services/agentMemory';

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    aIContext: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const prisma = require('../db/prisma').default;

describe('agentMemory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses a per-agent per-user conversation id', () => {
    expect(agentConversationId('a1', 'u1')).toBe('agent:a1:user:u1');
  });

  it('returns empty history when nothing stored', async () => {
    prisma.aIContext.findUnique.mockResolvedValue(null);
    await expect(loadAgentMemory('a1', 'u1')).resolves.toEqual([]);
  });

  it('keeps only user/assistant turns', async () => {
    prisma.aIContext.findUnique.mockResolvedValue({
      messages: [
        { role: 'system', content: 'nope' },
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hey' },
      ],
    });
    const msgs = await loadAgentMemory('a1', 'u1');
    expect(msgs).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hey' },
    ]);
  });

  it('appends and prunes on save', async () => {
    prisma.aIContext.findUnique.mockResolvedValue({
      messages: Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: String(i) })),
    });
    prisma.aIContext.upsert.mockResolvedValue({});
    await saveAgentMemory('a1', 'u1', 'new task', 'new answer');
    const saved = prisma.aIContext.upsert.mock.calls[0][0];
    expect(saved.create.messages.length).toBeLessThanOrEqual(12);
    expect(saved.update.messages.at(-1)).toEqual({ role: 'assistant', content: 'new answer' });
    expect(JSON.stringify(saved)).not.toMatch(/system/);
  });
});
