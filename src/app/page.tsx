'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AudioEngine } from '@/components/AudioEngine';
import { SaloonArtBackground } from '@/components/SaloonArtBackground';
import { Play, Pause, SkipBack, SkipForward, ExternalLink, Disc3 } from 'lucide-react';

interface PlaylistRow {
  id: string;
  order: number;
  title: string;
  youtubeId: string;
  spotifyUrl: string;
  ytMusicUrl: string;
}

interface RadioResponse {
  dayOfYear: number;
  todayIndex: number;
  isOverride: boolean;
  featuredPlaylist: PlaylistRow;
  playlists: PlaylistRow[];
  settings: {
    liveListenerBase: number;
  };
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function MinimalSaloonHomePage() {
  const [data, setData] = useState<RadioResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Audio state
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    trackTitle: '',
  });

  // Simulated live online listeners count
  const [listenerCount, setListenerCount] = useState(48);

  const handleAudioStateChange = useCallback((state: typeof audioState) => {
    setAudioState({
      isPlaying: state.isPlaying,
      currentTime: state.currentTime,
      duration: state.duration,
      trackTitle: state.trackTitle,
    });
  }, []);

  useEffect(() => {
    async function fetchRadio() {
      try {
        const res = await fetch('/api/public/radio');
        if (res.ok) {
          const json: RadioResponse = await res.json();
          setData(json);
          setListenerCount(json.settings?.liveListenerBase || 48);
        }
      } catch (e) {
        console.error('Failed to load radio:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRadio();
  }, []);

  // Fluctuating online listener counter
  useEffect(() => {
    const interval = setInterval(() => {
      setListenerCount((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        return Math.max(15, Math.min(200, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a0f0a] flex items-center justify-center text-amber-300">
        <Disc3 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const playlist = data?.featuredPlaylist;
  const spotifyUrl = playlist?.spotifyUrl || 'https://open.spotify.com';
  const ytMusicUrl =
    playlist?.ytMusicUrl ||
    (playlist?.youtubeId
      ? `https://music.youtube.com/playlist?list=${playlist.youtubeId}`
      : 'https://music.youtube.com');

  const togglePlay = () => {
    window.dispatchEvent(new CustomEvent('yt-toggle-play'));
  };

  const handlePrev = () => {
    window.dispatchEvent(new CustomEvent('yt-prev'));
  };

  const handleNext = () => {
    window.dispatchEvent(new CustomEvent('yt-next'));
  };

  return (
    <div className="min-h-screen text-amber-100 flex flex-col items-center justify-between p-6 sm:p-12 relative overflow-hidden select-none">
      {/* 3. Bright Artistic Saloon Background */}
      <SaloonArtBackground isPlaying={audioState.isPlaying} />

      {/* Hidden YouTube Iframe Audio Engine */}
      {playlist && (
        <AudioEngine
          playlistId={playlist.youtubeId}
          onStateChange={handleAudioStateChange}
        />
      )}

      {/* 3. People who are online */}
      <header className="z-10 pt-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-black/40 border border-amber-500/30 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>🎧 {listenerCount} Tamizhans listening</span>
        </div>
      </header>

      {/* Main Center Controls: 1. Play/Pause, Prev & Next Buttons & 2. Time */}
      <main className="z-10 flex flex-col items-center justify-center space-y-8 my-auto">
        
        {/* Active Playlist Title Badge */}
        {playlist && (
          <div className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-md">
            {playlist.title}
          </div>
        )}

        {/* Minimal Audio Controls Row: Prev, Play/Pause, Next */}
        <div className="flex items-center space-x-6 sm:space-x-8">
          
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="p-3 sm:p-4 rounded-full bg-black/40 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition active:scale-90 shadow-lg hover:border-amber-400"
            title="Previous Song"
          >
            <SkipBack className="w-6 h-6 sm:w-8 sm:h-8 fill-amber-300/30" />
          </button>

          {/* 1. Play / Pause Main Button */}
          <button
            onClick={togglePlay}
            className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative group ${
              audioState.isPlaying
                ? 'bg-amber-400 text-black shadow-amber-500/50 scale-105'
                : 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/30'
            }`}
            title={audioState.isPlaying ? 'Pause' : 'Play'}
          >
            {audioState.isPlaying ? (
              <Pause className="w-12 h-12 sm:w-16 sm:h-16 fill-black" />
            ) : (
              <Play className="w-12 h-12 sm:w-16 sm:h-16 fill-amber-300 group-hover:fill-amber-200 ml-1 transition" />
            )}

            {/* Vinyl Glow Ring when Playing */}
            {audioState.isPlaying && (
              <div className="absolute inset-0 rounded-full border-2 border-black/30 animate-ping opacity-25 pointer-events-none" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="p-3 sm:p-4 rounded-full bg-black/40 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition active:scale-90 shadow-lg hover:border-amber-400"
            title="Next Song"
          >
            <SkipForward className="w-6 h-6 sm:w-8 sm:h-8 fill-amber-300/30" />
          </button>

        </div>

        {/* 2. Track Time */}
        <div className="text-center space-y-1">
          <div className="text-base sm:text-lg font-mono font-bold text-amber-200 tracking-wider">
            {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
          </div>
          {audioState.trackTitle && (
            <p className="text-xs text-amber-300/80 max-w-sm truncate px-4 font-medium">
              {audioState.trackTitle}
            </p>
          )}
        </div>

      </main>

      {/* Outbound Links: 4. Spotify & 5. YouTube Music */}
      <footer className="z-10 pb-4 flex items-center space-x-4">
        {/* 4. Link for spotify playlist */}
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition hover:scale-105 shadow-xl backdrop-blur-md"
        >
          <span>Spotify Playlist</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-85" />
        </a>

        {/* 5. Link for youtube music playlist */}
        <a
          href={ytMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-bold transition hover:scale-105 shadow-xl backdrop-blur-md"
        >
          <span>YouTube Music</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-85" />
        </a>
      </footer>

    </div>
  );
}
