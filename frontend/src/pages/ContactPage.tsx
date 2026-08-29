import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contactApi } from '../lib/api';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSending(true);
    try {
      await contactApi.submit({ name, email, message, source: 'web' });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      toast.error('Could not send message. Try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-white/25 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
          <p className="text-sm text-muted-foreground mt-2">Have a question? Send us a message.</p>

          <form onSubmit={onSubmit} className="space-y-4 mt-6">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg border border-border bg-white/70 dark:bg-slate-900/60"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              type="email"
              className="w-full px-3 py-2 rounded-lg border border-border bg-white/70 dark:bg-slate-900/60"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message"
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white/70 dark:bg-slate-900/60"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          {sent && <p className="mt-4 text-sm text-emerald-600">Message received. We will get back soon.</p>}

          <div className="mt-8 flex items-center gap-4 text-sm">
            <Link to="/welcome" className="text-primary hover:underline">
              Back to welcome page
            </Link>
            <Link to="/help" className="text-primary hover:underline">
              Visit help center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
