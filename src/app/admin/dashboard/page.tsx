'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  LogOut,
  Radio,
  Plus,
  Trash2,
  Edit2,
  Save,
  DollarSign,
  Settings,
  ListMusic,
  Eye,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface Playlist {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
  order: number;
  isActive: boolean;
  trackCount: number;
  coverUrl: string | null;
}

interface SiteSettingsData {
  activeOverridePlaylistId: string | null;
  liveListenerBase: number;
  sponsorBannerEnabled: boolean;
  adSenseEnabled: boolean;
  adSensePublisherId: string;
  bannerText: string;
  customAdHtml: string;
  spotifyUrl: string;
  ytMusicUrl: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'playlists' | 'monetization' | 'settings'>('playlists');

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [settings, setSettings] = useState<SiteSettingsData>({
    activeOverridePlaylistId: null,
    liveListenerBase: 48,
    sponsorBannerEnabled: true,
    adSenseEnabled: true,
    adSensePublisherId: 'ca-pub-1234567890123456',
    bannerText: 'வணக்கம்! தமிழ் டீ கடை & சலூன் 90s/2000s Hits 💈☕ 24/7 Retro Radio',
    customAdHtml: '',
    spotifyUrl: 'https://open.spotify.com',
    ytMusicUrl: 'https://music.youtube.com',
  });

  const [noticeMessage, setNoticeMessage] = useState('');

  // Form State for Add / Edit Playlist
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formPlaylist, setFormPlaylist] = useState({
    title: '',
    description: '',
    youtubeId: '',
    category: '90s Hits',
    coverUrl: '',
    trackCount: 25,
  });

  // Check auth session
  useEffect(() => {
    async function checkAuth() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/admin/login');
          return;
        }

        await fetchDashboardData();
      } catch (e) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const pRes = await fetch('/api/admin/playlists');
      if (pRes.ok) {
        const pData = await pRes.json();
        setPlaylists(pData.playlists || []);
      }

      const sRes = await fetch('/api/admin/settings');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.settings) {
          setSettings(sData.settings);
        }
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handlePreviewYoutube = async (idOrUrl: string) => {
    if (!idOrUrl) return;
    try {
      const res = await fetch(`/api/admin/youtube-preview?id=${encodeURIComponent(idOrUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setFormPlaylist((prev) => ({
          ...prev,
          title: prev.title || data.title,
          youtubeId: data.youtubeId || prev.youtubeId,
          coverUrl: prev.coverUrl || data.thumbnailUrl,
        }));
        showNotice('Fetched YouTube metadata!');
      }
    } catch (e) {
      console.error('Failed preview', e);
    }
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const res = await fetch('/api/admin/playlists', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: isEditing, ...formPlaylist }),
        });
        if (res.ok) {
          showNotice('Playlist updated successfully!');
          setIsEditing(null);
          fetchDashboardData();
        }
      } else {
        const res = await fetch('/api/admin/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formPlaylist),
        });
        if (res.ok) {
          showNotice('New Playlist created!');
          setFormPlaylist({
            title: '',
            description: '',
            youtubeId: '',
            category: '90s Hits',
            coverUrl: '',
            trackCount: 25,
          });
          fetchDashboardData();
        }
      }
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const res = await fetch(`/api/admin/playlists?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotice('Playlist deleted!');
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  const handleToggleOverride = async (playlistId: string | null) => {
    try {
      const newOverride = settings.activeOverridePlaylistId === playlistId ? null : playlistId;
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, activeOverridePlaylistId: newOverride }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, activeOverridePlaylistId: newOverride }));
        showNotice(newOverride ? 'Daily playlist override active!' : 'Auto daily rotation restored!');
      }
    } catch (e) {
      console.error('Override error', e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showNotice('Site settings updated!');
      }
    } catch (e) {
      console.error('Settings save error', e);
    }
  };

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#130a06] flex items-center justify-center text-amber-300">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#130a06] text-amber-100 p-4 sm:p-8 saloon-bg-pattern">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Admin Navbar */}
        <div className="glass-panel rounded-3xl p-5 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-amber-200">
                Admin Control Dashboard
              </h1>
              <p className="text-xs text-amber-300/70">
                Tamil Deluxe Saloon • 10-Playlist Manager & Monetization
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
              <span>View Radio Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Floating Notice Toast */}
        {noticeMessage && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-amber-500/20 pb-3">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition ${
              activeTab === 'playlists'
                ? 'bg-amber-500 text-black shadow-lg'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            <span>Daily Playlists ({playlists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('monetization')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition ${
              activeTab === 'monetization'
                ? 'bg-amber-500 text-black shadow-lg'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Monetization & Ads</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-black shadow-lg'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Site Settings</span>
          </button>
        </div>

        {/* TAB 1: Playlists Manager */}
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Playlist Editor Form */}
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/25 h-fit space-y-4">
              <h3 className="text-lg font-bold text-amber-200 flex items-center space-x-2">
                {isEditing ? <Edit2 className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-amber-400" />}
                <span>{isEditing ? 'Edit Playlist' : 'Add New Playlist'}</span>
              </h3>

              <form onSubmit={handleSavePlaylist} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-amber-300/80 block mb-1">
                    YouTube Playlist ID or URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={formPlaylist.youtubeId}
                      onChange={(e) => setFormPlaylist({ ...formPlaylist, youtubeId: e.target.value })}
                      placeholder="e.g. PL9bw4S5AgFmP-..."
                      className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => handlePreviewYoutube(formPlaylist.youtubeId)}
                      className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-200 text-xs font-bold transition"
                    >
                      Fetch
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-amber-300/80 block mb-1">
                    Playlist Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formPlaylist.title}
                    onChange={(e) => setFormPlaylist({ ...formPlaylist, title: e.target.value })}
                    placeholder="90s Barber Shop Hits"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-amber-300/80 block mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={formPlaylist.category}
                    onChange={(e) => setFormPlaylist({ ...formPlaylist, category: e.target.value })}
                    placeholder="90s Classics"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-amber-300/80 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formPlaylist.description}
                    onChange={(e) => setFormPlaylist({ ...formPlaylist, description: e.target.value })}
                    placeholder="Nostalgic cassette classics..."
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-amber-300/80 block mb-1">
                    Cover Art Image URL
                  </label>
                  <input
                    type="text"
                    value={formPlaylist.coverUrl}
                    onChange={(e) => setFormPlaylist({ ...formPlaylist, coverUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition"
                  >
                    {isEditing ? 'Save Changes' : 'Create Playlist'}
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(null);
                        setFormPlaylist({
                          title: '',
                          description: '',
                          youtubeId: '',
                          category: '90s Hits',
                          coverUrl: '',
                          trackCount: 25,
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right: List of 10 Curated Playlists */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-amber-200">
                  Active Playlists ({playlists.length})
                </h3>
                <span className="text-xs text-amber-300/60">
                  Daily rotation selects index <code className="text-amber-300">(Day % total)</code>
                </span>
              </div>

              <div className="space-y-3">
                {playlists.map((pl, index) => {
                  const isOverride = settings.activeOverridePlaylistId === pl.id;

                  return (
                    <div
                      key={pl.id}
                      className={`glass-panel p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                        isOverride
                          ? 'border-amber-400 bg-amber-500/15'
                          : 'border-amber-500/20 bg-black/40'
                      }`}
                    >
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-amber-500/30">
                          {/* eslint-disable-next-app/no-img-element */}
                          <img
                            src={
                              pl.coverUrl ||
                              'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=200&q=80'
                            }
                            alt={pl.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-bold text-amber-300">
                              Day {index + 1}
                            </span>
                            <span className="text-[11px] text-amber-400/80 font-mono truncate">
                              ID: {pl.youtubeId.substring(0, 12)}...
                            </span>
                            {isOverride && (
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[9px] font-extrabold uppercase">
                                OVERRIDE ACTIVE
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-amber-100 truncate mt-0.5">
                            {pl.title}
                          </h4>
                          <p className="text-xs text-amber-300/60 truncate">
                            {pl.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleOverride(pl.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                            isOverride
                              ? 'bg-amber-500 text-black border-amber-400'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                          title="Force override daily rotation"
                        >
                          {isOverride ? 'Active' : 'Override'}
                        </button>

                        <button
                          onClick={() => {
                            setIsEditing(pl.id);
                            setFormPlaylist({
                              title: pl.title,
                              description: pl.description,
                              youtubeId: pl.youtubeId,
                              category: pl.category,
                              coverUrl: pl.coverUrl || '',
                              trackCount: pl.trackCount,
                            });
                          }}
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeletePlaylist(pl.id)}
                          className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Monetization & Ad Settings */}
        {activeTab === 'monetization' && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/25 space-y-6 max-w-3xl">
            <h3 className="text-lg font-bold text-amber-200 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>Monetization & Ad Readiness Settings</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-amber-500/20">
                  <div>
                    <h4 className="text-sm font-bold text-amber-100">
                      Enable Custom Sponsor Banners
                    </h4>
                    <p className="text-xs text-amber-300/60">
                      Display sponsor slots under the radio player.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sponsorBannerEnabled}
                    onChange={(e) => setSettings({ ...settings, sponsorBannerEnabled: e.target.checked })}
                    className="w-5 h-5 accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-amber-500/20">
                  <div>
                    <h4 className="text-sm font-bold text-amber-100">
                      Enable Google AdSense Slots
                    </h4>
                    <p className="text-xs text-amber-300/60">
                      Compliant with Google AdSense banner placements.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.adSenseEnabled}
                    onChange={(e) => setSettings({ ...settings, adSenseEnabled: e.target.checked })}
                    className="w-5 h-5 accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Publisher ID */}
              <div>
                <label className="text-xs font-semibold text-amber-300/90 block mb-1">
                  Google AdSense Publisher ID
                </label>
                <input
                  type="text"
                  value={settings.adSensePublisherId}
                  onChange={(e) => setSettings({ ...settings, adSensePublisherId: e.target.value })}
                  placeholder="ca-pub-1234567890123456"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Custom Ad HTML */}
              <div>
                <label className="text-xs font-semibold text-amber-300/90 block mb-1">
                  Custom Banner HTML Code
                </label>
                <textarea
                  rows={4}
                  value={settings.customAdHtml}
                  onChange={(e) => setSettings({ ...settings, customAdHtml: e.target.value })}
                  placeholder="<div class='p-3 text-center text-xs'>Sponsor Ad Code...</div>"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg transition"
              >
                Save Monetization Settings
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Site Settings */}
        {activeTab === 'settings' && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/25 space-y-6 max-w-3xl">
            <h3 className="text-lg font-bold text-amber-200 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-amber-400" />
              <span>Site Metadata & Announcement Settings</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-amber-300/90 block mb-1">
                  Top Announcement Ticker Text
                </label>
                <input
                  type="text"
                  value={settings.bannerText}
                  onChange={(e) => setSettings({ ...settings, bannerText: e.target.value })}
                  placeholder="வணக்கம்! தமிழ் டீ கடை & சலூன் 90s/2000s Hits..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300/90 block mb-1">
                  Base Live Listener Count
                </label>
                <input
                  type="number"
                  value={settings.liveListenerBase}
                  onChange={(e) => setSettings({ ...settings, liveListenerBase: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300/90 block mb-1">
                  Outbound Spotify Playlist URL
                </label>
                <input
                  type="text"
                  value={settings.spotifyUrl}
                  onChange={(e) => setSettings({ ...settings, spotifyUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300/90 block mb-1">
                  Outbound YouTube Music URL
                </label>
                <input
                  type="text"
                  value={settings.ytMusicUrl}
                  onChange={(e) => setSettings({ ...settings, ytMusicUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg transition"
              >
                Save Site Settings
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
