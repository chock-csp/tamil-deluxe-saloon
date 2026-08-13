'use client';

import React from 'react';
import Image from 'next/image';

interface SaloonArtBackgroundProps {
  isPlaying: boolean;
}

export const SaloonArtBackground: React.FC<SaloonArtBackgroundProps> = ({
  isPlaying,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Real 1990s South Indian Barber Shop Artwork Background (Desktop Wide) */}
      <div
        className={`hidden md:block absolute inset-0 transition-transform duration-1000 ${
          isPlaying ? 'scale-105 filter brightness-110 contrast-105' : 'scale-100 filter brightness-95'
        }`}
      >
        <Image
          src="/images/saloon-wide.png"
          alt="1990s South Indian Barber Shop Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-45 mix-blend-luminosity"
        />
      </div>

      {/* 2. Real 1990s South Indian Barber Shop Artwork Background (Mobile Vertical) */}
      <div
        className={`block md:hidden absolute inset-0 transition-transform duration-1000 ${
          isPlaying ? 'scale-105 filter brightness-110 contrast-105' : 'scale-100 filter brightness-95'
        }`}
      >
        <Image
          src="/images/saloon-vertical.png"
          alt="1990s South Indian Barber Shop Vertical Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-50 mix-blend-luminosity"
        />
      </div>

      {/* Warm Retro Amber & Teak Saloon Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0805] via-[#1a0f0a]/70 to-[#0a0604]/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0805]/90 via-transparent to-[#0d0805]/90" />

      {/* Animated Barber Pole Spiral Light Pillars (Left & Right) */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-12 sm:w-20 opacity-30 mix-blend-screen transition-opacity duration-700 ${
          isPlaying ? 'opacity-60' : 'opacity-30'
        }`}
        style={{
          background:
            'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.4) 20px, rgba(255, 255, 255, 0.4) 20px, rgba(255, 255, 255, 0.4) 40px, rgba(20, 184, 166, 0.4) 40px, rgba(20, 184, 166, 0.4) 60px)',
          backgroundSize: '200% 200%',
          animation: 'barberPole 8s linear infinite',
        }}
      />
      <div
        className={`absolute top-0 bottom-0 right-0 w-12 sm:w-20 opacity-30 mix-blend-screen transition-opacity duration-700 ${
          isPlaying ? 'opacity-60' : 'opacity-30'
        }`}
        style={{
          background:
            'repeating-linear-gradient(-45deg, rgba(245, 158, 11, 0.4), rgba(245, 158, 11, 0.4) 20px, rgba(255, 255, 255, 0.4) 20px, rgba(255, 255, 255, 0.4) 40px, rgba(239, 68, 68, 0.4) 40px, rgba(239, 68, 68, 0.4) 60px)',
          backgroundSize: '200% 200%',
          animation: 'barberPole 8s linear infinite reverse',
        }}
      />

      {/* Bright Central Warmth & Neon Glow Orbs */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] rounded-full bg-amber-500/25 blur-[120px] transition-all duration-1000 ${
          isPlaying ? 'scale-110 opacity-90 animate-pulse' : 'scale-100 opacity-50'
        }`}
      />
      <div
        className={`absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-teal-500/20 blur-[100px] transition-opacity duration-1000 ${
          isPlaying ? 'opacity-80' : 'opacity-40'
        }`}
      />

      {/* Vintage Tamil Saloon Watermark Typography */}
      <div className="absolute inset-0 flex justify-between items-center px-6 sm:px-16 pointer-events-none opacity-20">
        <span className="text-amber-200 font-serif text-6xl sm:text-9xl font-black tracking-widest transform -rotate-12 select-none">
          டீ கடை ☕
        </span>
        <span className="text-teal-200 font-serif text-6xl sm:text-9xl font-black tracking-widest transform rotate-12 select-none">
          சலூன் 💈
        </span>
      </div>

      {/* Audio Reactive Visualizer Top Light Bars */}
      <div className="absolute top-0 inset-x-0 h-24 flex items-start justify-center space-x-1 sm:space-x-2 pt-2 px-8 opacity-70">
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
    </div>
  );
};
