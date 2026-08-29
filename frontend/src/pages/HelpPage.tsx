import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const tutorialSlides = [
  {
    title: '1. Create a Workflow',
    text: 'Open Workflows, click create, then add your trigger and actions. Save and test with sample data.',
  },
  {
    title: '2. Connect Integrations',
    text: 'Go to Integrations, choose an app, authorize it, then use its nodes inside your workflow.',
  },
  {
    title: '3. Run and Monitor',
    text: 'From Dashboard or Workflow list, run automation and check execution logs to verify outputs.',
  },
  {
    title: '4. Build Agents',
    text: 'Create AI agents with instructions, choose tools, then run tasks and review activity history.',
  },
];

const faqs = [
  {
    q: 'How do I start quickly?',
    a: 'Use templates from the Templates page, then replace app connections and text prompts with your own setup.',
  },
  {
    q: 'Can I use multiple integrations in one flow?',
    a: 'Yes. You can chain many app actions in one workflow and pass data from one node to another.',
  },
  {
    q: 'Where can I debug failed runs?',
    a: 'Open the workflow executions and inspect logs, status, and payload values for each step.',
  },
  {
    q: 'Can my team collaborate?',
    a: 'Yes. Teams can manage workflows together with role-based access and shared project spaces.',
  },
];

export default function HelpPage() {
  const [idx, setIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const current = tutorialSlides[idx];
  const next = () => setIdx((i) => (i + 1) % tutorialSlides.length);
  const prev = () => setIdx((i) => (i - 1 + tutorialSlides.length) % tutorialSlides.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Help Center</h1>
            <p className="text-muted-foreground mt-2">Learn every flow of our tools with interactive slides.</p>
          </div>
          <Link to="/welcome" className="px-3 py-2 rounded-lg text-sm border border-border bg-white/70 dark:bg-slate-900/50">
            Back
          </Link>
        </div>

        <section className="rounded-2xl border border-white/25 dark:border-white/10 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">Interactive Tutorial</h2>
            <div className="text-xs text-muted-foreground">{idx + 1} / {tutorialSlides.length}</div>
          </div>
          <div className="mt-5 rounded-xl border border-border/60 bg-white/60 dark:bg-slate-900/60 p-5 min-h-40 animate-fade-up">
            <h3 className="text-lg font-semibold text-foreground">{current.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{current.text}</p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button onClick={prev} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white/70 dark:bg-slate-800/60 text-sm">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button onClick={next} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/25 dark:border-white/10 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">FAQs</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={f.q} className="rounded-xl border border-border/60 bg-white/60 dark:bg-slate-900/50">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-4 flex items-center justify-between text-sm font-medium text-foreground"
                >
                  <span>{f.q}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
