'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  Disc3,
  Radio,
} from 'lucide-react';

interface PlayerPillProps {
  isPlaying: boolean;
  hasUserStarted: boolean;
  trackTitle: string;
  artistName: string;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  videoId?: string;
  coverUrl?: string | null;
  playlistTitle?: string;
  trackIndex: number;
  totalTracks: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (level: number) => void;
  onToggleMute: () => void;
  onOpenPlaylistModal: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlayerPill: React.FC<PlayerPillProps> = ({
  isPlaying,
  hasUserStarted,
  trackTitle,
  artistName,
  currentTime,
  duration,
  volume,
  isMuted,
  videoId,
  coverUrl,
  playlistTitle,
  trackIndex,
  totalTracks,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onOpenPlaylistModal,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const albumArt =
    coverUrl ||
    (videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=300&q=80');

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Player Pill Glass Container */}
      <div className="glass-pill rounded-3xl p-4 sm:p-5 shadow-2xl relative border border-amber-500/25 transition-all duration-300">
        
        {/* Top Info Bar */}
        <div className="flex items-center justify-between text-xs text-amber-300/80 mb-3 px-1">
          <div className="flex items-center space-x-2 font-medium">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="truncate max-w-[200px] sm:max-w-[300px]">
              {playlistTitle || 'Tamil Deluxe Radio'}
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 font-mono">
              Track {trackIndex + 1} / {totalTracks || 1}
            </span>
          </div>

          <button
            onClick={onOpenPlaylistModal}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition text-[11px] font-medium"
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Playlists</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5">
          {/* Spinning Vinyl Cover Art */}
          <div
            onClick={onTogglePlay}
            className="relative flex-shrink-0 cursor-pointer group"
          >
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-amber-400/40 shadow-lg relative flex items-center justify-center bg-black ${
                isPlaying ? 'animate-spin-vinyl' : 'animate-spin-vinyl paused'
              }`}
            >
              {/* Album Art Image */}
              {/* eslint-disable-next-app/no-img-element */}
              <img
                src={albumArt}
                alt="Vinyl Album Cover"
                className="w-full h-full object-cover rounded-full"
              />
              {/* Center Vinyl Spindle Hole */}
              <div className="absolute w-4 h-4 rounded-full bg-amber-950 border border-amber-400/80 shadow-inner" />
            </div>

            {/* Play/Pause Hover Overlay Icon */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              {isPlaying ? (
                <Pause className="w-6 h-6 text-amber-300 fill-amber-300" />
              ) : (
                <Play className="w-6 h-6 text-amber-300 fill-amber-300 ml-0.5" />
              )}
            </div>
          </div>

          {/* Track Information & Controls */}
          <div className="flex-1 w-full min-w-0 space-y-2">
            
            {/* Title & Artist Marquee */}
            <div className="overflow-hidden">
              <h3 className="text-base sm:text-lg font-bold text-amber-100 truncate tracking-wide">
                {trackTitle || 'Tap Play to start Saloon Radio'}
              </h3>
              <p className="text-xs sm:text-sm text-amber-300/70 truncate">
                {artistName || 'தமிழ் டீ கடை & சலூன் 90s/2000s Hits'}
              </p>
            </div>

            {/* Seekbar Slider & Time Labels */}
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <span className="text-[11px] font-mono text-amber-400/80 w-10 text-right">
                  {formatTime(currentTime)}
                </span>

                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-amber-950/80 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                <span className="text-[11px] font-mono text-amber-400/80 w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Prev Button */}
            <button
              onClick={onPrev}
              className="p-2 sm:p-2.5 rounded-full hover:bg-amber-500/10 text-amber-300 transition active:scale-95"
              title="Previous Song"
            >
              <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-300/30" />
            </button>

            {/* Play / Pause Main Button */}
            <button
              onClick={onTogglePlay}
              className="p-3 sm:p-4 rounded-full bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/30 transition transform hover:scale-105 active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-black" />
              ) : (
                <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-black ml-0.5" />
              )}
            </button>

            {/* Next Button */}
            <button
              onClick={onNext}
              className="p-2 sm:p-2.5 rounded-full hover:bg-amber-500/10 text-amber-300 transition active:scale-95"
              title="Next Song"
            >
              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-300/30" />
            </button>

            {/* Volume Control */}
            <div className="relative">
              <button
                onClick={onToggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="p-2 rounded-full hover:bg-amber-500/10 text-amber-300/80 hover:text-amber-300 transition"
                title="Volume"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {/* Popup Volume Slider */}
              {showVolumeSlider && (
                <div
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 glass-panel rounded-xl shadow-xl flex items-center w-32 border border-amber-500/30"
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-full h-1 bg-amber-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* User Tap Prompt Notice when playback hasn't started */}
        {!hasUserStarted && !isPlaying && (
          <div className="mt-3 py-1.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center animate-bounce">
            <p className="text-xs text-amber-200 font-medium">
              👉 Click <span className="underline font-bold">Play</span> to tune into Today&apos;s Tamil Radio Station! 📻
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
