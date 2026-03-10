import { Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { BrandLogo } from '../components/BrandLogo';
import { ArrowRight, ShieldCheck, Sparkles, Workflow, Puzzle, Star } from 'lucide-react';

const highlights = [
  { icon: Workflow, title: 'Fast Workflow Builder', text: 'Design automation in minutes with visual blocks.' },
  { icon: Puzzle, title: 'Many Integrations', text: 'Connect business apps and keep all tools in one flow.' },
  { icon: ShieldCheck, title: 'Safer Operations', text: 'Role controls, tracking, and clear run history.' },
];

export default function WelcomePage() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-blue-400/30 blur-3xl dark:bg-yellow-300/15 animate-float-slow"></div>
        <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl dark:bg-blue-500/20 animate-float-fast"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between">
          <BrandLogo className="flex items-center gap-2" imageClassName="h-10 w-auto" showText />
          <div className="flex items-center gap-2">
            <Link to="/help" className="text-sm px-3 py-2 rounded-lg hover:bg-white/70 dark:hover:bg-slate-800/70">
              Help
            </Link>
            <Link to="/login" className="text-sm px-3 py-2 rounded-lg hover:bg-white/70 dark:hover:bg-slate-800/70">
              Login
            </Link>
            <Link to="/register" className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              Sign Up
            </Link>
          </div>
        </header>

        <section className="pt-14 pb-10 animate-fade-up">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Your automation command center
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
              Build. Integrate. Automate.
              <br />
              Run your work with Silo.
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl">
              This is our face, our pride, and our selling point. Create smart workflows, connect apps, and move faster with less manual work.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900"
              >
                I already have account
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-10">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-white/25 dark:border-white/10 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl p-5 animate-fade-up">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-white/25 dark:border-white/10 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl p-6 mb-10">
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star key={idx} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            “Silo gave us a clean, modern way to automate across teams. Setup was quick and results were visible from day one.”
          </p>
        </section>

        <footer className="border-t border-border/70 py-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Silo</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-foreground">Contact Us</Link>
            <Link to="/help" className="hover:text-foreground">Help & Tutorial</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
