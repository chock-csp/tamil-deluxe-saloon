'use client';

import React, { useEffect, useState } from 'react';
import { Lock, LogOut, Radio, Save, CheckCircle2, Eye, KeyRound, AlertCircle, ArrowLeft, RefreshCw, Star, RotateCcw, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';

interface PlaylistRow {
  id: string;
  order: number;
  title: string;
  youtubeId: string;
  spotifyUrl: string;
  ytMusicUrl: string;
  isActive: boolean;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Login state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // CSRF token — obtained from login or /api/auth/me response
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Dashboard state
  const [rows, setRows] = useState<PlaylistRow[]>([]);
  const [activeOverrideId, setActiveOverrideId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  // Check Session
  useEffect(() => {
    async function checkAuth() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.csrfToken) setCsrfToken(meData.csrfToken);
          setIsAuthenticated(true);
          await fetchRowsData();
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const fetchRowsData = async () => {
    try {
      const res = await fetch('/api/admin/playlists');
      if (res.ok) {
        const data = await res.json();
        setRows(data.playlists || []);
      }

      const sRes = await fetch('/api/admin/settings');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.settings) {
          setActiveOverrideId(sData.settings.activeOverridePlaylistId || null);
        }
      }
    } catch (e) {
      console.error('Failed to load playlist rows:', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Invalid credentials');
        setLoggingIn(false);
        return;
      }

      if (data.csrfToken) setCsrfToken(data.csrfToken);
      setIsAuthenticated(true);
      await fetchRowsData();
    } catch (err) {
      setLoginError('Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  const handleRowChange = (index: number, field: keyof PlaylistRow, value: any) => {
    const updated = [...rows];
    let val = value;
    if (field === 'youtubeId' && typeof val === 'string' && val.includes('list=')) {
      const extracted = val.split('list=')[1].split('&')[0];
      val = extracted;
      updated[index].ytMusicUrl = `https://music.youtube.com/playlist?list=${extracted}`;
    }
    updated[index] = { ...updated[index], [field]: val };
    setRows(updated);
  };

  const handleToggleActive = (index: number) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], isActive: !updated[index].isActive };
    setRows(updated);
  };

  const adminHeaders = () => ({
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'x-admin-csrf-token': csrfToken } : {}),
  });

  const handleSetOverride = async (rowId: string, index: number) => {
    const isCurrentlyOverride = activeOverrideId === rowId;
    const newOverrideId = isCurrentlyOverride ? null : rowId;
    const newOverrideIndex = isCurrentlyOverride ? null : index;

    setActiveOverrideId(newOverrideId);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({
          activeOverridePlaylistId: newOverrideId,
          activeOverrideIndex: newOverrideIndex,
        }),
      });
      await fetchRowsData();
      showNotice(
        newOverrideId
          ? `Set "${rows[index]?.title || 'Playlist'}" as Playlist of the Day!`
          : 'Playlist of the Day reset to Automatic Daily Rotation'
      );
    } catch (e) {
      console.error('Failed to set override:', e);
    }
  };

  const handleResetPlaylistOfDay = async () => {
    setActiveOverrideId(null);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({
          activeOverridePlaylistId: null,
          activeOverrideIndex: null,
        }),
      });
      await fetchRowsData();
      showNotice('Playlist of the Day reset to Automatic Rotation (Day % Active Rows)');
    } catch (e) {
      console.error('Failed to reset override:', e);
    }
  };

  const handleSaveAllRows = async () => {
    setSaving(true);
    try {
      // 1. Save rows array to JSON storage
      const pRes = await fetch('/api/admin/playlists', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ rows }),
      });

      if (!pRes.ok) {
        if (pRes.status === 401) {
          setIsAuthenticated(false);
          showNotice('Session expired. Please sign in again.');
          return;
        }
        const errJson = await pRes.json().catch(() => ({}));
        showNotice(errJson.error || 'Failed to save playlist rows');
        return;
      }

      // 2. Save Active Override
      const activeIndex = rows.findIndex((r) => r.id === activeOverrideId);
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({
          activeOverridePlaylistId: activeOverrideId,
          activeOverrideIndex: activeIndex !== -1 ? activeIndex : null,
        }),
      });

      // 3. Re-fetch fresh state from playlists.json
      await fetchRowsData();

      showNotice('Playlist Rows & Settings Saved Successfully!');
    } catch (e) {
      console.error('Save failed:', e);
      showNotice('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0907] flex items-center justify-center text-amber-300">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // 1. UNAUTHENTICATED: Render Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d0907] text-amber-100 flex items-center justify-center p-4 saloon-bg-pattern relative">
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Radio</span>
        </Link>

        <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-amber-100 tracking-tight">
              Admin Authentication
            </h1>
            <p className="text-xs text-amber-300/70">
              Sign in to manage active playlists and Playlist of the Day
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center space-x-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

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
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition transform active:scale-95 disabled:opacity-50"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In to Admin Panel'}
            </button>
          </form>

          <div className="text-center text-[11px] text-amber-400/50 pt-2 border-t border-amber-500/10">
            Seed Credentials: <code className="text-amber-300">admin</code> / <code className="text-amber-300">saloon123</code>
          </div>
        </div>
      </div>
    );
  }

  const activeCount = rows.filter((r) => r.isActive !== false).length;
  const activeOverrideRow = rows.find((r) => r.id === activeOverrideId);

  // 2. AUTHENTICATED: Render Playlist Manager Dashboard
  return (
    <div className="min-h-screen bg-[#0d0907] text-amber-100 p-4 sm:p-8 saloon-bg-pattern">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Admin Header */}
        <div className="glass-panel rounded-3xl p-5 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-amber-200">
                Playlists & Rotation Manager
              </h1>
              <p className="text-xs text-amber-300/70">
                {activeCount} of 10 Playlists Active in Rotation Pool
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
            >
              <Eye className="w-4 h-4" />
              <span>View Main Site</span>
            </Link>

            <button
              onClick={handleSaveAllRows}
              disabled={saving}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Playlist of the Day Status Banner */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-950/30">
          <div className="flex items-center space-x-3">
            <Star className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-200">
                Playlist of the Day Status:
              </div>
              <div className="text-xs text-amber-300/80">
                {activeOverrideRow ? (
                  <span>
                    Manual Override Active: <strong className="text-amber-400">{activeOverrideRow.title}</strong>
                  </span>
                ) : (
                  <span>
                    Automatic Rotation Active: Picked dynamically via algorithm <code className="text-amber-300 font-mono">(Day % {activeCount} Active Playlists)</code>
                  </span>
                )}
              </div>
            </div>
          </div>

          {activeOverrideRow && (
            <button
              onClick={handleResetPlaylistOfDay}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Playlist of the Day (Auto Rotation)</span>
            </button>
          )}
        </div>

        {noticeMessage && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* 10-Row Table List */}
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-amber-500/25 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/20 pb-3 gap-2">
            <div>
              <h2 className="text-base font-bold text-amber-200">
                Configure Playlists & Active Rotation Pool
              </h2>
              <p className="text-xs text-amber-300/60">
                Toggle active status for multiple playlists. Algorithmic selection picks 1 daily from active playlists.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {rows.slice(0, 10).map((row, idx) => {
              const isOverride = activeOverrideId === row.id;

              return (
                <div
                  key={row.id || idx}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isOverride
                      ? 'bg-amber-500/15 border-amber-400'
                      : row.isActive
                      ? 'bg-black/40 border-amber-500/20'
                      : 'bg-black/20 border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      
                      {/* Active Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(idx)}
                        className={`p-1.5 rounded-lg transition ${
                          row.isActive
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-gray-500 hover:text-gray-400'
                        }`}
                        title={row.isActive ? 'Active in Rotation' : 'Inactive'}
                      >
                        {row.isActive ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                        Row {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => handleRowChange(idx, 'title', e.target.value)}
                        className="bg-transparent font-bold text-amber-100 text-sm focus:outline-none border-b border-amber-500/30 focus:border-amber-400 px-1 py-0.5"
                        placeholder={`Row ${idx + 1} Title`}
                      />
                    </div>

                    {/* Controls: Set as Playlist of the Day & Active Toggle */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSetOverride(row.id, idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center space-x-1.5 ${
                          isOverride
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{isOverride ? 'Playlist of the Day (Active)' : 'Set as Playlist of the Day'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* YouTube Playlist ID */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-amber-300/80 block">
                        ▶️ YouTube Playlist ID / URL
                      </label>
                      <input
                        type="text"
                        value={row.youtubeId}
                        onChange={(e) => handleRowChange(idx, 'youtubeId', e.target.value)}
                        placeholder="e.g. PL9bw4S5AgFmP-..."
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    {/* Spotify Playlist URL */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-emerald-400/90 block">
                        💚 Spotify Playlist URL
                      </label>
                      <input
                        type="text"
                        value={row.spotifyUrl}
                        onChange={(e) => handleRowChange(idx, 'spotifyUrl', e.target.value)}
                        placeholder="https://open.spotify.com/playlist/..."
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-emerald-500/30 text-emerald-200 text-xs focus:outline-none focus:border-emerald-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between items-center">
            <div className="text-xs text-amber-300/60">
              {activeCount} of {rows.length} playlists active in daily rotation.
            </div>
            <button
              onClick={handleSaveAllRows}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save All Changes'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
