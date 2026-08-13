'use client';

import React from 'react';

interface SaloonArtBackgroundProps {
  isPlaying: boolean;
}

export const SaloonArtBackground: React.FC<SaloonArtBackgroundProps> = ({
  isPlaying,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Bright Artistic Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f0a] via-[#2a170e] to-[#0f1d1a]" />

      {/* Animated Barber Pole Spiral Light Pillars (Left & Right) */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-16 sm:w-24 opacity-30 mix-blend-screen transition-opacity duration-700 ${
          isPlaying ? 'opacity-50' : 'opacity-25'
        }`}
        style={{
          background:
            'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.4) 20px, rgba(255, 255, 255, 0.4) 20px, rgba(255, 255, 255, 0.4) 40px, rgba(20, 184, 166, 0.4) 40px, rgba(20, 184, 166, 0.4) 60px)',
          backgroundSize: '200% 200%',
          animation: 'barberPole 8s linear infinite',
        }}
      />
      <div
        className={`absolute top-0 bottom-0 right-0 w-16 sm:w-24 opacity-30 mix-blend-screen transition-opacity duration-700 ${
          isPlaying ? 'opacity-50' : 'opacity-25'
        }`}
        style={{
          background:
            'repeating-linear-gradient(-45deg, rgba(245, 158, 11, 0.4), rgba(245, 158, 11, 0.4) 20px, rgba(255, 255, 255, 0.4) 20px, rgba(255, 255, 255, 0.4) 40px, rgba(239, 68, 68, 0.4) 40px, rgba(239, 68, 68, 0.4) 60px)',
          backgroundSize: '200% 200%',
          animation: 'barberPole 8s linear infinite reverse',
        }}
      />

      {/* Bright Central Golden Warmth & Neon Glow Orbs */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-amber-500/20 blur-[120px] transition-all duration-1000 ${
          isPlaying ? 'scale-110 opacity-80 animate-pulse' : 'scale-100 opacity-40'
        }`}
      />
      <div
        className={`absolute bottom-10 left-1/3 w-96 h-96 rounded-full bg-teal-500/15 blur-[100px] transition-opacity duration-1000 ${
          isPlaying ? 'opacity-70' : 'opacity-30'
        }`}
      />
      <div
        className={`absolute top-10 right-1/3 w-96 h-96 rounded-full bg-red-500/15 blur-[100px] transition-opacity duration-1000 ${
          isPlaying ? 'opacity-70' : 'opacity-30'
        }`}
      />

      {/* Vintage Saloon & Tea Shop Art Text Overlay */}
      <div className="absolute inset-0 flex justify-between items-center px-6 sm:px-20 pointer-events-none opacity-20">
        <span className="text-amber-300 font-serif text-6xl sm:text-9xl font-black tracking-widest transform -rotate-12 select-none">
          டீ கடை
        </span>
        <span className="text-teal-300 font-serif text-6xl sm:text-9xl font-black tracking-widest transform rotate-12 select-none">
          சலூன்
        </span>
      </div>

      {/* Audio Reactive Visualizer Top Light Bars */}
      <div className="absolute top-0 inset-x-0 h-24 flex items-start justify-center space-x-1 sm:space-x-2 pt-2 px-8 opacity-60">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 sm:w-2 bg-gradient-to-b from-amber-400 via-teal-300 to-transparent rounded-b-full transition-all duration-300"
            style={{
              height: isPlaying ? `${Math.floor(Math.sin(i + Date.now()) * 50) + 30}%` : '15%',
              animation: isPlaying
                ? `pulse ${0.3 + (i % 6) * 0.1}s ease-in-out infinite alternate`
                : 'none',
            }}
          />
        ))}
      </div>

      {/* Bottom Light Glow Overlay */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0a0705] via-[#1a0f0a]/60 to-transparent" />
    </div>
  );
};
