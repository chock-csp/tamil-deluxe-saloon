'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AudioEngine } from '@/components/AudioEngine';
import { SaloonArtBackground } from '@/components/SaloonArtBackground';
import { Play, Pause, SkipBack, SkipForward, ExternalLink, Disc3, Music } from 'lucide-react';

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
  const [initialThumbnail, setInitialThumbnail] = useState<string | null>(null);

  // Audio state
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    trackTitle: '',
    videoId: '',
  });

  // Simulated live online listeners count
  const [listenerCount, setListenerCount] = useState(48);

  const handleAudioStateChange = useCallback((state: any) => {
    setAudioState({
      isPlaying: Boolean(state.isPlaying),
      currentTime: Number(state.currentTime) || 0,
      duration: Number(state.duration) || 0,
      trackTitle: state.trackTitle || '',
      videoId: state.videoId || '',
    });
  }, []);

  useEffect(() => {
    async function fetchRadio() {
      try {
        const res = await fetch('/api/public/radio', { cache: 'no-store' });
        if (res.ok) {
          const json: RadioResponse = await res.json();
          setData(json);
          setListenerCount(json.settings?.liveListenerBase || 48);

          // Fetch initial thumbnail for playlist immediately on site load
          const yId = json.featuredPlaylist?.youtubeId;
          if (yId) {
            try {
              const noembedRes = await fetch(
                `https://noembed.com/embed?url=https://www.youtube.com/playlist?list=${yId}`
              );
              if (noembedRes.ok) {
                const noembedData = await noembedRes.json();
                if (noembedData.thumbnail_url) {
                  setInitialThumbnail(noembedData.thumbnail_url);
                }
              }
            } catch (e) {
              // Ignore noembed errors
            }
          }
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

  // YouTube Thumbnail URL: Active Video ID -> Initial Playlist Thumbnail -> Fallback null
  const youtubeThumbnailUrl = audioState.videoId
    ? `https://img.youtube.com/vi/${audioState.videoId}/hqdefault.jpg`
    : initialThumbnail || null;

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
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-black/50 border border-amber-500/30 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>🎧 {listenerCount} Tamizhans listening</span>
        </div>
      </header>

      {/* Main Center Module (saloon.wtf Song Player Reference) */}
      <main className="z-10 flex flex-col items-center justify-center space-y-6 my-auto">

        {/* 2. YouTube Thumbnail Album Cover / Vinyl Disc Module */}
        <div className="relative group flex flex-col items-center">
          
          {/* Circular Stationary YouTube Thumbnail Cover */}
          <div
            className={`w-40 h-40 sm:w-52 sm:h-52 rounded-full p-2 bg-gradient-to-tr from-amber-500/30 via-amber-400/10 to-teal-500/30 border-2 border-amber-500/40 shadow-2xl relative flex items-center justify-center overflow-hidden transition-transform duration-700 ${
              audioState.isPlaying ? 'scale-105 shadow-amber-500/40' : 'scale-100'
            }`}
          >
            {youtubeThumbnailUrl ? (
              // Stationary YouTube Video Thumbnail Image
              <img
                src={youtubeThumbnailUrl}
                alt={audioState.trackTitle || 'YouTube Song Thumbnail'}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              // Vinyl Placeholder Icon
              <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center border border-amber-500/20">
                <Music className="w-16 h-16 text-amber-400/60" />
              </div>
            )}

            {/* Vinyl Center Hole */}
            <div className="absolute w-8 h-8 rounded-full bg-[#0a0705] border-2 border-amber-500/60 shadow-inner flex items-center justify-center z-10 pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            </div>

            {/* Subtle Glow Ring when Playing */}
            {audioState.isPlaying && (
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping opacity-30 pointer-events-none" />
            )}
          </div>

        </div>

        {/* Minimal Control Buttons Row: Prev, Play/Pause, Next */}
        <div className="flex items-center space-x-6 sm:space-x-8 pt-2">
          
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="p-3 sm:p-4 rounded-full bg-black/50 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition active:scale-90 shadow-lg hover:border-amber-400"
            title="Previous Song"
          >
            <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-300/40" />
          </button>

          {/* 1. Central Play / Pause Button */}
          <button
            onClick={togglePlay}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative group ${
              audioState.isPlaying
                ? 'bg-amber-400 text-black shadow-amber-500/60 scale-105'
                : 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/30'
            }`}
            title={audioState.isPlaying ? 'Pause' : 'Play'}
          >
            {audioState.isPlaying ? (
              <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-black" />
            ) : (
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-amber-300 group-hover:fill-amber-200 ml-1 transition" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="p-3 sm:p-4 rounded-full bg-black/50 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition active:scale-90 shadow-lg hover:border-amber-400"
            title="Next Song"
          >
            <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-300/40" />
          </button>

        </div>

        {/* 2. Track Time & Song Title */}
        <div className="text-center space-y-1 pt-1 max-w-md">
          <div className="text-base sm:text-lg font-mono font-bold text-amber-200 tracking-wider">
            {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
          </div>
          {audioState.trackTitle && (
            <p className="text-xs sm:text-sm text-amber-300/90 font-medium truncate px-4">
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
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition hover:scale-105 shadow-xl backdrop-blur-md"
        >
          <span>Spotify Playlist</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-85" />
        </a>

        {/* 5. Link for youtube music playlist */}
        <a
          href={ytMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-950/70 hover:bg-red-900/90 border border-red-500/40 text-red-300 text-xs font-bold transition hover:scale-105 shadow-xl backdrop-blur-md"
        >
          <span>YouTube Music</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-85" />
        </a>
      </footer>

    </div>
  );
}
