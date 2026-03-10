import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { workflowApi } from '../lib/api';
import { APP_INTEGRATIONS, POPULAR_INTEGRATIONS } from '../lib/integrations';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Sparkles,
  Star,
  Workflow,
  Zap,
} from 'lucide-react';

const featureCards = [
  {
    title: 'Visual Workflow Builder',
    desc: 'Build automations fast with drag-and-drop nodes and reusable templates.',
    icon: Workflow,
  },
  {
    title: 'AI Agents',
    desc: 'Generate and run intelligent flows with prompt-driven automation.',
    icon: Bot,
  },
  {
    title: 'Reliable Orchestration',
    desc: 'Trigger, retry, and monitor complex jobs from one place.',
    icon: Layers,
  },
  {
    title: 'Security & Control',
    desc: 'Role-based access, approvals, and clear execution history for teams.',
    icon: ShieldCheck,
  },
];

const serviceGroups = [
  {
    id: 'automation',
    name: 'Automation',
    bullets: ['No-code workflow setup', 'Reusable templates', 'Event and schedule triggers'],
  },
  {
    id: 'operations',
    name: 'Operations',
    bullets: ['Execution logs and audit trails', 'Team approvals and assignments', 'Status dashboards'],
  },
  {
    id: 'ai',
    name: 'AI Services',
    bullets: ['Prompt-to-workflow generation', 'AI routing and enrichment', 'Smart content and summarization'],
  },
];

const reviews = [
  {
    name: 'Aung M.',
    role: 'Ops Manager',
    text: 'Silo helped us automate repetitive tasks quickly. The UI is clean and the team adopted it fast.',
  },
  {
    name: 'Myo T.',
    role: 'Product Lead',
    text: 'We connected multiple tools in one day. Monitoring and troubleshooting are much easier now.',
  },
  {
    name: 'Nora L.',
    role: 'Automation Engineer',
    text: 'The workflow + integrations combo is practical. It feels modern without being overwhelming.',
  },
];

const glassCard =
  'rounded-2xl border border-white/25 dark:border-white/10 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl shadow-sm';

export default function DashboardPage() {
  const [activeService, setActiveService] = useState('automation');

  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await workflowApi.list();
      return response.data.workflows;
    },
  });

  const workflows = data || [];
  const activeCount = workflows.filter((w: any) => w.isActive).length;
  const integrationsPreview = useMemo(() => APP_INTEGRATIONS.slice(0, 12), []);
  const selectedService = serviceGroups.find((g) => g.id === activeService) || serviceGroups[0];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/35 to-cyan-300/20 blur-3xl dark:from-yellow-300/20 dark:to-amber-500/25"></div>
        <div className="absolute top-1/4 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 blur-3xl dark:from-blue-400/20 dark:to-violet-500/20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-10">
        <section className={`${glassCard} p-8 md:p-10 bg-gradient-to-br from-white/70 to-blue-100/30 dark:from-slate-900/60 dark:to-slate-800/40`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Modern automation platform
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                Automate your work with smart workflows and integrations
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Build flows, connect services, and run reliable operations from one modern home page.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/workflows/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Start Building
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/integrations"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-white/60 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-900/70 transition-colors"
                >
                  Explore Integrations
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <div className={`${glassCard} p-4`}>
                <p className="text-xs text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold text-foreground mt-1">{workflows.length}</p>
              </div>
              <div className={`${glassCard} p-4`}>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground mt-1">{activeCount}</p>
              </div>
              <div className={`${glassCard} p-4`}>
                <p className="text-xs text-muted-foreground">Integrations</p>
                <p className="text-2xl font-bold text-foreground mt-1">{APP_INTEGRATIONS.length}+</p>
              </div>
              <div className={`${glassCard} p-4`}>
                <p className="text-xs text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold text-foreground mt-1">40+</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Features</h2>
            <p className="text-sm text-muted-foreground">Core capabilities to run workflows at scale.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={`${glassCard} p-5 hover:translate-y-[-2px] transition-transform`}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Services</h2>
            <p className="text-sm text-muted-foreground">Choose the lane you want to focus on.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {serviceGroups.map((service) => (
              <button
                key={service.id}
                onClick={() => setActiveService(service.id)}
                className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                  activeService === service.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white/50 dark:bg-slate-900/40 border-border hover:bg-white/70 dark:hover:bg-slate-900/60'
                }`}
              >
                {service.name}
              </button>
            ))}
          </div>
          <div className={`${glassCard} p-6`}>
            <h3 className="font-semibold text-foreground mb-3">{selectedService.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {selectedService.bullets.map((b) => (
                <div key={b} className="rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 p-4">
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>{b}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">App Integrations</h2>
              <p className="text-sm text-muted-foreground">Connect your favorite tools and services.</p>
            </div>
            <Link to="/integrations" className="text-sm font-medium text-primary hover:underline">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {integrationsPreview.map((app) => (
              <Link
                key={app.provider}
                to={`/integrations/${app.provider}`}
                className={`${glassCard} p-4 text-center hover:scale-[1.01] transition-transform`}
              >
                <div
                  className="w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center text-xl"
                  style={{ backgroundColor: app.color + '1f' }}
                >
                  {app.icon}
                </div>
                <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_INTEGRATIONS.slice(0, 8).map((app) => (
              <span key={app.provider} className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary">
                {app.name}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">What users say</h2>
            <p className="text-sm text-muted-foreground">Real feedback from teams using Silo workflows.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <div key={review.name} className={`${glassCard} p-5`}>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-6">"{review.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                    {review.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${glassCard} p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-primary/10 to-cyan-400/10 dark:from-primary/20 dark:to-sky-500/10`}>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-1">Ready to launch a new workflow?</h3>
            <p className="text-sm text-muted-foreground">Start in minutes with modern UI, integrations, and AI assistance.</p>
          </div>
          <Link
            to="/workflows/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors self-start md:self-auto"
          >
            <Zap className="h-4 w-4" />
            Build Workflow
          </Link>
        </section>
      </div>
    </div>
  );
}
