import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const SENTRY_SCRUB_KEYS = /apikey|api_key|authorization|password|token|secret|cookie|credential|refresh|prompt|messages/i;

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
  release: import.meta.env.VITE_GIT_SHA,
  tracesSampleRate: 0.1,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  beforeSend(event) {
    function scrub(obj: any): any {
      if (!obj || typeof obj !== 'object') return obj;
      const out: any = Array.isArray(obj) ? [] : {};
      for (const k of Object.keys(obj)) {
        out[k] = SENTRY_SCRUB_KEYS.test(k) ? '[redacted]' : scrub(obj[k]);
      }
      return out;
    }
    if (event.extra) event.extra = scrub(event.extra);
    if (event.request?.headers) {
      const h = event.request.headers as Record<string, string>;
      if (h['authorization']) h['authorization'] = '[redacted]';
    }
    return event;
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
