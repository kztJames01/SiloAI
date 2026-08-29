export function isAdmin(role?: string | null) {
  return role === 'ADMIN';
}

export function homeTabPath(role?: string | null) {
  return isAdmin(role) ? '/(tabs)/workflows' : '/(tabs)/field';
}

export function executionIdFromAgentRun(exec: any): string | null {
  const steps = exec?.steps;
  const list = Array.isArray(steps) ? steps : typeof steps === 'string' ? safeJson(steps) : null;
  const wfId = list?.[0]?.workflowExecutionId;
  return typeof wfId === 'string' ? wfId : null;
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
