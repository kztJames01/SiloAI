type RouteKey = string;

const startedAt = Date.now();

const counters = {
  requests: 0,
  errors: 0,
  totalDurationMs: 0,
  byStatus: {} as Record<string, number>,
  byMethod: {} as Record<string, number>,
  byRoute: {} as Record<RouteKey, number>,
};

export function normalizeRoute(path: string) {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '/:id')
    .replace(/\/[0-9a-f]{24}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

export function recordRequest(method: string, route: string, status: number, durationMs: number) {
  counters.requests += 1;
  counters.totalDurationMs += durationMs;
  if (status >= 500) counters.errors += 1;

  const statusKey = String(status);
  counters.byStatus[statusKey] = (counters.byStatus[statusKey] || 0) + 1;
  counters.byMethod[method] = (counters.byMethod[method] || 0) + 1;
  counters.byRoute[route] = (counters.byRoute[route] || 0) + 1;
}

export function getMetricsSnapshot() {
  const uptimeSec = Math.floor((Date.now() - startedAt) / 1000);
  const avgLatencyMs = counters.requests ? Math.round(counters.totalDurationMs / counters.requests) : 0;

  return {
    uptimeSec,
    requests: counters.requests,
    errors: counters.errors,
    avgLatencyMs,
    byStatus: counters.byStatus,
    byMethod: counters.byMethod,
    byRoute: counters.byRoute,
    timestamp: new Date().toISOString(),
  };
}

export function getPrometheusMetrics() {
  const snap = getMetricsSnapshot();
  const lines = [
    '# HELP silo_uptime_seconds Process uptime in seconds',
    '# TYPE silo_uptime_seconds gauge',
    `silo_uptime_seconds ${snap.uptimeSec}`,
    '# HELP silo_http_requests_total Total HTTP requests',
    '# TYPE silo_http_requests_total counter',
    `silo_http_requests_total ${snap.requests}`,
    '# HELP silo_http_errors_total Total HTTP 5xx responses',
    '# TYPE silo_http_errors_total counter',
    `silo_http_errors_total ${snap.errors}`,
    '# HELP silo_http_request_duration_ms_avg Average request duration',
    '# TYPE silo_http_request_duration_ms_avg gauge',
    `silo_http_request_duration_ms_avg ${snap.avgLatencyMs}`,
  ];

  for (const [status, count] of Object.entries(snap.byStatus)) {
    lines.push(`silo_http_responses_total{status="${status}"} ${count}`);
  }

  return lines.join('\n') + '\n';
}
