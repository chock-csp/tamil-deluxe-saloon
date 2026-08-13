'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Radio, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setError('An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#130a06] text-amber-100 flex items-center justify-center p-4 saloon-bg-pattern relative">
      
      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Saloon Radio</span>
      </Link>

      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-amber-100 retro-neon-text">
            Admin Portal
          </h1>
          <p className="text-xs text-amber-300/70">
            Tamil Deluxe Saloon • 90s/2000s Playlist & Site Manager
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center space-x-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-amber-300/90 block">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 focus:outline-none focus:border-amber-400 text-sm"
              placeholder="admin"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-amber-300/90 block">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 focus:outline-none focus:border-amber-400 text-sm pr-10"
                placeholder="••••••••"
              />
              <KeyRound className="w-4 h-4 text-amber-500/50 absolute right-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="text-center text-[11px] text-amber-400/50 pt-2 border-t border-amber-500/10">
          Default seed credentials: <code className="text-amber-300">admin</code> / <code className="text-amber-300">saloon123</code>
        </div>

      </div>
    </div>
  );
}
