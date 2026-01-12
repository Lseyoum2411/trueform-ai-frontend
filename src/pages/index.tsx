import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, sport })
      });

      if (response.ok) {
        // Store email in localStorage for access checks
        localStorage.setItem('formlab_email', email);
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to join waitlist');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-8">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-3xl font-bold text-white mb-4">You're on the list!</h2>
            <p className="text-gray-300 mb-6">
              We'll send you an email at <strong>{email}</strong> when you're approved to access FormLab.
            </p>
            <p className="text-sm text-gray-400">
              Keep an eye on your inbox (and spam folder) for your invitation.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold text-white mb-4">
            FormLab
          </h1>
          <p className="text-2xl text-gray-300 mb-2">
            AI-Powered Form Analysis
          </p>
          <p className="text-lg text-gray-400">
            Perfect your technique in basketball, golf, weightlifting, and more
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-md mx-auto"
        >
          <div className="text-center mb-6">
            <span className="inline-block bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              EARLY ACCESS
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">Join the Waitlist</h2>
            <p className="text-gray-400">
              Be among the first to access AI-powered form analysis
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Sport
              </label>
              <select
                required
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a sport</option>
                <option value="basketball">Basketball</option>
                <option value="golf">Golf</option>
                <option value="weightlifting">Weightlifting</option>
                <option value="baseball">Baseball</option>
                <option value="soccer">Soccer</option>
                <option value="track_and_field">Track & Field</option>
                <option value="volleyball">Volleyball</option>
                <option value="lacrosse">Lacrosse</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            We'll never share your email. Unsubscribe anytime.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">
            Questions? Email us at <a href="mailto:hello@formlab.to" className="text-blue-400 hover:underline">hello@formlab.to</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
