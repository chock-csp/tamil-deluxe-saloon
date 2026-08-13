'use client';

import React from 'react';

interface SaloonBackgroundProps {
  isPlaying: boolean;
}

export const SaloonBackground: React.FC<SaloonBackgroundProps> = ({ isPlaying }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden saloon-bg-pattern">
      {/* Background Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

      {/* Ambient Lighting Orbs */}
      <div
        className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl transition-opacity duration-1000 ${
          isPlaying ? 'opacity-100 animate-pulse' : 'opacity-40'
        }`}
      />
      <div
        className={`absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-teal-600/10 blur-3xl transition-opacity duration-1000 ${
          isPlaying ? 'opacity-100 animate-pulse' : 'opacity-30'
        }`}
      />

      {/* Retro Wall Posters & Saloon Silhouettes */}
      <div className="absolute inset-0 opacity-15 mix-blend-overlay flex justify-between items-center px-12 pointer-events-none">
        <div className="text-amber-500/30 text-8xl font-black select-none font-serif transform -rotate-12 hidden lg:block">
          டீ கடை ☕
        </div>
        <div className="text-teal-500/30 text-8xl font-black select-none font-serif transform rotate-12 hidden lg:block">
          சலூன் 💈
        </div>
      </div>

      {/* Audio Reactive Visualizer Bars at the top */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-end justify-center space-x-1 sm:space-x-1.5 opacity-40 px-4">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 sm:w-2 bg-gradient-to-t from-amber-500 to-teal-400 rounded-t-sm transition-all duration-300"
            style={{
              height: isPlaying ? `${Math.floor(Math.sin(i + Date.now()) * 40) + 20}%` : '8%',
              animation: isPlaying
                ? `pulse ${0.4 + (i % 5) * 0.15}s ease-in-out infinite alternate`
                : 'none',
            }}
          />
        ))}
      </div>

      {/* Bottom Subtle Wood Texture Glow */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black via-amber-950/20 to-transparent" />
    </div>
  );
};
