import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-white/25 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-4 mt-6 text-sm text-muted-foreground">
            <p>We collect only the information needed to provide workflow automation and integrations.</p>
            <p>We use your data to run automations, improve service quality, and support troubleshooting.</p>
            <p>We do not sell your personal data. Access is restricted to authorized systems and team members.</p>
            <p>You can request account data changes or deletion by contacting our support team.</p>
          </div>

          <div className="mt-8">
            <Link to="/welcome" className="text-sm text-primary hover:underline">
              Back to welcome page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
