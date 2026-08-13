'use client';

import React, { useEffect, useState } from 'react';

interface LiveListenerPillProps {
  baseCount?: number;
}

export const LiveListenerPill: React.FC<LiveListenerPillProps> = ({
  baseCount = 48,
}) => {
  const [listenerCount, setListenerCount] = useState(baseCount);

  useEffect(() => {
    // Dynamic fluctuation simulator for live listener count
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
      setListenerCount((prev) => Math.max(12, Math.min(250, prev + delta)));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-lg">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>
      <span>🎧 {listenerCount} Tamizhans listening live</span>
    </div>
  );
};
