import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface WaitlistUser {
  email: string;
  name: string;
  sport: string;
  joined_at: string;
  approved: boolean;
  approved_at?: string;
}

export default function AdminWaitlist() {
  const [waitlist, setWaitlist] = useState<WaitlistUser[]>([]);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Simple password check (use environment variable in production)
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      setAuthenticated(true);
      loadWaitlist();
    } else {
      setError('Invalid password');
    }
  };

  const loadWaitlist = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/waitlist/list`);
      setWaitlist(response.data);
    } catch (error) {
      console.error('Error loading waitlist:', error);
      setError('Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (email: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/waitlist/approve?email=${encodeURIComponent(email)}`);
      loadWaitlist(); // Reload list
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Failed to approve user');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-white text-2xl mb-4 font-bold">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="bg-gray-900 text-white px-4 py-3 rounded-lg mb-4 w-full border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
          />
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg w-full font-semibold transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Waitlist Management</h1>
          <button
            onClick={loadWaitlist}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Sport</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {waitlist.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No users on waitlist
                    </td>
                  </tr>
                ) : (
                  waitlist.map((user) => (
                    <tr key={user.email} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 capitalize">{user.sport.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(user.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.approved ? (
                          <span className="text-green-400 font-semibold">✓ Approved</span>
                        ) : (
                          <span className="text-yellow-400 font-semibold">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {!user.approved ? (
                          <button
                            onClick={() => approveUser(user.email)}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-400">
          Total: {waitlist.length} users | Approved: {waitlist.filter(u => u.approved).length} | Pending: {waitlist.filter(u => !u.approved).length}
        </div>
      </div>
    </div>
  );
}

