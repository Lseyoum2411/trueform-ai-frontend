import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { joinWaitlist } from '@/lib/api';
import { Loader } from '@/components/Loader';

const SPORTS = [
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'golf', name: 'Golf', icon: '⛳' },
  { id: 'weightlifting', name: 'Weightlifting', icon: '🏋️' },
  { id: 'baseball', name: 'Baseball', icon: '⚾' },
  { id: 'soccer', name: 'Soccer', icon: '⚽' },
  { id: 'track_field', name: 'Track & Field', icon: '🏃' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'lacrosse', name: 'Lacrosse', icon: '🥍' },
  { id: 'all', name: 'All Sports', icon: '🎯' },
];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sport, setSport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await joinWaitlist({
        name,
        email,
        sport: sport || 'all',
      });

      // Store email in localStorage for access checking
      localStorage.setItem('waitlist_email', email);

      setSuccess(true);
      
      // Redirect to waiting page after a brief delay
      setTimeout(() => {
        router.push('/waiting');
      }, 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to join waitlist. Please try again.'
      );
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-6">
          <div className="text-6xl">✅</div>
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-3xl font-bold text-foreground">You're on the list!</h1>
            <p className="text-muted-foreground">
              Redirecting you to the waiting page...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Join the Waitlist</h1>
            <p className="text-muted-foreground">
              Get early access to FormLab - AI-powered sports form analysis
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="sport" className="block text-sm font-medium text-foreground mb-2">
                Sport of Interest (Optional)
              </label>
              <select
                id="sport"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
              >
                <option value="">Select a sport...</option>
                {SPORTS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-card">
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name || !email}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                loading || !name || !email
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader />
                  <span>Joining waitlist...</span>
                </div>
              ) : (
                'Join Waitlist'
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
