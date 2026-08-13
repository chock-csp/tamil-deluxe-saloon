'use client';

import React, { useEffect, useState } from 'react';
import { AudioEngine } from '@/components/AudioEngine';
import { PlayerPill } from '@/components/PlayerPill';
import { LiveListenerPill } from '@/components/LiveListenerPill';
import { OutboundLinksPill } from '@/components/OutboundLinksPill';
import { AdSlot } from '@/components/AdSlot';
import { SaloonBackground } from '@/components/SaloonBackground';
import { PlaylistModal, PlaylistData } from '@/components/PlaylistModal';
import { Radio, Sparkles, Lock, Disc3 } from 'lucide-react';
import Link from 'next/link';

interface RadioConfigResponse {
  dayOfYear: number;
  todayIndex: number;
  isOverride: boolean;
  featuredPlaylist: PlaylistData;
  playlists: PlaylistData[];
  settings: {
    bannerText: string;
    liveListenerBase: number;
    sponsorBannerEnabled: boolean;
    adSenseEnabled: boolean;
    adSensePublisherId: string;
    customAdHtml: string;
    spotifyUrl: string;
    ytMusicUrl: string;
  };
}

export default function SaloonHomePage() {
  const [data, setData] = useState<RadioConfigResponse | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<PlaylistData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Audio Engine State
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 80,
    isMuted: false,
    trackTitle: '',
    artistName: '',
    videoId: '',
    trackIndex: 0,
    totalTracks: 1,
    hasUserStarted: false,
  });

  // Controls triggers
  const [controlAction, setControlAction] = useState<{
    type: string;
    payload?: number | string;
    time?: number;
  } | null>(null);

  useEffect(() => {
    async function fetchRadioData() {
      try {
        const res = await fetch('/api/public/radio');
        if (res.ok) {
          const json: RadioConfigResponse = await res.json();
          setData(json);
          setActivePlaylist(json.featuredPlaylist);
        }
      } catch (e) {
        console.error('Failed to load radio config:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRadioData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#130a06] flex items-center justify-center text-amber-300">
        <div className="text-center space-y-3">
          <Disc3 className="w-12 h-12 animate-spin-vinyl mx-auto text-amber-400" />
          <p className="text-sm font-semibold tracking-wider">
            Loading Tamil Deluxe Saloon Radio... 💈☕
          </p>
        </div>
      </div>
    );
  }

  const playlists = data?.playlists || [];
  const settings = data?.settings;

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden text-amber-100 selection:bg-amber-500 selection:text-black">
      {/* Background Atmosphere & Animations */}
      <SaloonBackground isPlaying={audioState.isPlaying} />

      {/* Hidden YouTube Iframe Audio Engine */}
      {activePlaylist && (
        <AudioEngine
          playlistId={activePlaylist.youtubeId}
          onStateChange={(state) => setAudioState(state)}
        />
      )}

      {/* Main Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Header Bar */}
        <header className="w-full px-4 py-4 sm:px-8 border-b border-amber-500/15 glass-panel">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Logo & Title */}
            <div className="flex items-center space-x-3 text-center md:text-left">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
                <Radio className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-amber-200 retro-neon-text">
                  Tamil Deluxe Saloon
                </h1>
                <p className="text-xs text-amber-300/80 font-medium">
                  தமிழ் டீ கடை & சலூன் 90s/2000s Hits 💈☕
                </p>
              </div>
            </div>

            {/* Header Pills & Admin Link */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <LiveListenerPill baseCount={settings?.liveListenerBase || 48} />
              
              <OutboundLinksPill
                spotifyUrl={settings?.spotifyUrl}
                ytMusicUrl={settings?.ytMusicUrl}
              />

              <Link
                href="/admin/login"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            </div>

          </div>
        </header>

        {/* Ticker Announcement Banner */}
        {settings?.bannerText && (
          <div className="w-full bg-amber-950/60 border-b border-amber-500/20 py-2 px-4 overflow-hidden">
            <div className="max-w-6xl mx-auto flex items-center space-x-3 text-xs text-amber-300">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 font-bold text-[10px] uppercase tracking-wider text-amber-200 border border-amber-500/30">
                NOTICE
              </span>
              <p className="truncate font-medium">
                {settings.bannerText}
              </p>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex flex-col justify-center items-center text-center space-y-6">
          
          {/* Radio Display Vinyl Card */}
          <div className="glass-panel p-6 sm:p-10 rounded-3xl w-full border border-amber-500/25 shadow-2xl space-y-6 max-w-2xl relative overflow-hidden">
            
            {/* Corner Badge */}
            <div className="absolute top-4 right-4 flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Day {(data?.todayIndex || 0) + 1} of 10
              </span>
            </div>

            {/* Active Playlist Artwork */}
            <div className="relative mx-auto w-40 h-40 sm:w-52 sm:h-52 rounded-full border-4 border-amber-500/30 shadow-2xl overflow-hidden flex items-center justify-center bg-black group">
              {/* eslint-disable-next-app/no-img-element */}
              <img
                src={
                  activePlaylist?.coverUrl ||
                  'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=600&q=80'
                }
                alt="Active Playlist Cover"
                className={`w-full h-full object-cover rounded-full ${
                  audioState.isPlaying ? 'animate-spin-vinyl' : 'animate-spin-vinyl paused'
                }`}
              />
              <div className="absolute w-8 h-8 rounded-full bg-amber-950 border-2 border-amber-400 shadow-inner" />
            </div>

            {/* Active Station Info */}
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                {activePlaylist?.category || '90s Tamil Classics'}
              </span>

              <h2 className="text-xl sm:text-3xl font-extrabold text-amber-100 tracking-wide mt-2">
                {activePlaylist?.title || 'Tamil Deluxe Radio'}
              </h2>

              <p className="text-xs sm:text-sm text-amber-300/70 max-w-lg mx-auto leading-relaxed">
                {activePlaylist?.description ||
                  'Nostalgic Barber Shop & Tea Kadai Tamil Hits 24/7 uninterrupted.'}
              </p>
            </div>

            {/* Station Switcher Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-bold transition shadow-lg hover:scale-105"
            >
              <Disc3 className="w-4 h-4 text-amber-400" />
              <span>Browse All 10 Daily Playlists</span>
            </button>

          </div>

          {/* Ad Banner Slot (Top/Middle) */}
          <AdSlot
            position="top"
            adSenseEnabled={settings?.adSenseEnabled}
            sponsorBannerEnabled={settings?.sponsorBannerEnabled}
            adSensePublisherId={settings?.adSensePublisherId}
            customAdHtml={settings?.customAdHtml}
          />

        </main>

        {/* Bottom Audio Player Pill */}
        <footer className="sticky bottom-4 z-40 py-2">
          {activePlaylist && (
            <PlayerPill
              isPlaying={audioState.isPlaying}
              hasUserStarted={audioState.hasUserStarted}
              trackTitle={audioState.trackTitle || activePlaylist.title}
              artistName={audioState.artistName || activePlaylist.description}
              currentTime={audioState.currentTime}
              duration={audioState.duration}
              volume={audioState.volume}
              isMuted={audioState.isMuted}
              videoId={audioState.videoId}
              coverUrl={activePlaylist.coverUrl}
              playlistTitle={activePlaylist.title}
              trackIndex={audioState.trackIndex}
              totalTracks={audioState.totalTracks}
              onTogglePlay={() => {
                const el = document.querySelector('#yt-hidden-audio-player');
                if (el) {
                  // Trigger YT audio engine control
                  const ev = new CustomEvent('yt-toggle-play');
                  window.dispatchEvent(ev);
                }
                // Dispatch click to invisible iframe player or handle direct trigger
                if (window.YT && window.YT.Player) {
                  const btn = document.querySelector('button');
                }
              }}
              onNext={() => {
                const ev = new CustomEvent('yt-next');
                window.dispatchEvent(ev);
              }}
              onPrev={() => {
                const ev = new CustomEvent('yt-prev');
                window.dispatchEvent(ev);
              }}
              onSeek={(seconds) => {
                const ev = new CustomEvent('yt-seek', { detail: seconds });
                window.dispatchEvent(ev);
              }}
              onVolumeChange={(level) => {
                const ev = new CustomEvent('yt-volume', { detail: level });
                window.dispatchEvent(ev);
              }}
              onToggleMute={() => {
                const ev = new CustomEvent('yt-mute');
                window.dispatchEvent(ev);
              }}
              onOpenPlaylistModal={() => setIsModalOpen(true)}
            />
          )}
        </footer>

        {/* 10 Playlist Selection Modal */}
        <PlaylistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          playlists={playlists}
          currentPlaylistId={activePlaylist?.id || ''}
          todayIndex={data?.todayIndex || 0}
          onSelectPlaylist={(pl) => setActivePlaylist(pl)}
        />

      </div>
    </div>
  );
}
