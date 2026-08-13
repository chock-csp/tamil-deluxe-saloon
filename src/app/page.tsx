'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AudioEngine } from '@/components/AudioEngine';
import { Play, Pause, ExternalLink, Disc3 } from 'lucide-react';

interface PlaylistRow {
  id: string;
  title: string;
  youtubeId: string;
  spotifyUrl: string;
  ytMusicUrl: string;
}

interface RadioResponse {
  featuredPlaylist: PlaylistRow;
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
      <div className="min-h-screen bg-[#0a0705] flex items-center justify-center text-amber-300/80">
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

  return (
    <div className="min-h-screen bg-[#0a0705] text-amber-100 flex flex-col items-center justify-between p-6 sm:p-12 relative overflow-hidden select-none">
      {/* Background Subtle Ambient Glow */}
      <div
        className={`absolute w-96 h-96 rounded-full bg-amber-600/10 blur-3xl transition-opacity duration-1000 ${
          audioState.isPlaying ? 'opacity-100 animate-pulse' : 'opacity-20'
        }`}
      />

      {/* Hidden YouTube Iframe Audio Engine */}
      {playlist && (
        <AudioEngine
          playlistId={playlist.youtubeId}
          onStateChange={handleAudioStateChange}
        />
      )}

      {/* 3. People who are online */}
      <header className="z-10 pt-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-300/90 text-xs font-semibold backdrop-blur-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>🎧 {listenerCount} Tamizhans listening</span>
        </div>
      </header>

      {/* Main Center Area: 1. Play Button & 2. Time */}
      <main className="z-10 flex flex-col items-center justify-center space-y-8 my-auto">
        
        {/* Minimal Play / Pause Main Button */}
        <button
          onClick={togglePlay}
          className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative group ${
            audioState.isPlaying
              ? 'bg-amber-400 text-black shadow-amber-500/40 scale-105'
              : 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/30'
          }`}
          title={audioState.isPlaying ? 'Pause' : 'Play'}
        >
          {audioState.isPlaying ? (
            <Pause className="w-12 h-12 sm:w-16 sm:h-16 fill-black" />
          ) : (
            <Play className="w-12 h-12 sm:w-16 sm:h-16 fill-amber-300 group-hover:fill-amber-200 ml-1 transition" />
          )}

          {/* Subtle Outer Vinyl Ring when Playing */}
          {audioState.isPlaying && (
            <div className="absolute inset-0 rounded-full border border-black/30 animate-ping opacity-20 pointer-events-none" />
          )}
        </button>

        {/* 2. Track Time */}
        <div className="text-center space-y-1">
          <div className="text-sm sm:text-base font-mono font-medium text-amber-300/80 tracking-wider">
            {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
          </div>
          {audioState.trackTitle && (
            <p className="text-xs text-amber-400/60 max-w-xs truncate px-4">
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
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition hover:scale-105 shadow-md"
        >
          <span>Spotify Playlist</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-75" />
        </a>

        {/* 5. Link for youtube music playlist */}
        <a
          href={ytMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold transition hover:scale-105 shadow-md"
        >
          <span>YouTube Music</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-75" />
        </a>
      </footer>

    </div>
  );
}
