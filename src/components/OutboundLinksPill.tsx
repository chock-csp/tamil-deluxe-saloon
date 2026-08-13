'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface OutboundLinksPillProps {
  spotifyUrl?: string;
  ytMusicUrl?: string;
}

export const OutboundLinksPill: React.FC<OutboundLinksPillProps> = ({
  spotifyUrl = 'https://open.spotify.com',
  ytMusicUrl = 'https://music.youtube.com',
}) => {
  return (
    <div className="flex items-center space-x-2">
      <a
        href={spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/20 text-emerald-300 text-xs font-medium transition hover:scale-105"
      >
        <span>Spotify</span>
        <ExternalLink className="w-3 h-3 opacity-70" />
      </a>

      <a
        href={ytMusicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 text-xs font-medium transition hover:scale-105"
      >
        <span>YT Music</span>
        <ExternalLink className="w-3 h-3 opacity-70" />
      </a>
    </div>
  );
};
