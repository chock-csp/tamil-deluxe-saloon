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
      {/* 1. Crystal Clear Desktop Background Image */}
      <div
        className={`hidden md:block absolute inset-0 transition-transform duration-700 ${
          isPlaying ? 'scale-105' : 'scale-100'
        }`}
      >
        <Image
          src="/images/tea_kadai_desktop.png"
          alt="Retro Tamil tea kadai with a tea master pouring tea"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-100"
        />
      </div>

      {/* 2. Crystal Clear Mobile Background Image */}
      <div
        className={`block md:hidden absolute inset-0 transition-transform duration-700 ${
          isPlaying ? 'scale-105' : 'scale-100'
        }`}
      >
        <Image
          src="/images/tea_kadai_mobile.png"
          alt="Retro Tamil tea kadai with a tea master, copper boiler, and customers"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-100"
        />
      </div>

      {/* Top & bottom scrims so player controls stay readable on the dark photo */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Audio Reactive Visualizer Top Light Bars */}
      <div className="absolute top-0 inset-x-0 h-16 flex items-start justify-center space-x-1.5 sm:space-x-2 pt-2 px-8 opacity-70">
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 sm:w-2 bg-gradient-to-b from-amber-400 via-amber-200 to-transparent rounded-b-full transition-all duration-300"
            style={{
              height: isPlaying ? `${Math.floor(Math.sin(i + Date.now()) * 50) + 30}%` : '12%',
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
