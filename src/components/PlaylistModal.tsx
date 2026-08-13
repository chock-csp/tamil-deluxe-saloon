'use client';

import React from 'react';
import { X, Calendar, Music, Sparkles, CheckCircle2 } from 'lucide-react';

export interface PlaylistData {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
  order: number;
  trackCount: number;
  coverUrl?: string | null;
}

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: PlaylistData[];
  currentPlaylistId: string;
  todayIndex: number;
  onSelectPlaylist: (playlist: PlaylistData) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlists,
  currentPlaylistId,
  todayIndex,
  onSelectPlaylist,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-amber-500/20 flex items-center justify-between bg-amber-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-100">
                10 Daily Saloon Radio Playlists
              </h2>
              <p className="text-xs text-amber-300/70">
                Automatic daily rotation • 90s & 2000s Kollywood Classics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-amber-500/20 text-amber-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playlist Grid / List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {playlists.map((pl, idx) => {
            const isToday = idx === todayIndex;
            const isSelected = pl.id === currentPlaylistId;
            const cover =
              pl.coverUrl ||
              'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=300&q=80';

            return (
              <div
                key={pl.id}
                onClick={() => {
                  onSelectPlaylist(pl);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center space-x-4 group ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400/80 shadow-lg shadow-amber-500/10'
                    : 'bg-black/40 border-amber-500/15 hover:bg-amber-500/10 hover:border-amber-500/40'
                }`}
              >
                {/* Playlist Thumbnail */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-amber-500/30">
                  {/* eslint-disable-next-app/no-img-element */}
                  <img
                    src={cover}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-amber-300">
                    Day {idx + 1}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-[10px] text-amber-300 font-semibold border border-amber-500/20">
                      {pl.category}
                    </span>
                    {isToday && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px] text-emerald-300 font-bold border border-emerald-500/30">
                        <Sparkles className="w-3 h-3" />
                        <span>Today&apos;s Featured</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-amber-100 group-hover:text-amber-300 transition truncate mt-1">
                    {pl.title}
                  </h3>
                  <p className="text-xs text-amber-300/60 line-clamp-1 mt-0.5">
                    {pl.description}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <CheckCircle2 className="w-6 h-6 text-amber-400" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 group-hover:bg-amber-500/30 text-amber-300 flex items-center justify-center transition">
                      <Calendar className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-amber-500/20 bg-amber-950/30 text-center text-xs text-amber-300/70">
          The radio automatically shifts to the next playlist at midnight! 🕛
        </div>

      </div>
    </div>
  );
};
