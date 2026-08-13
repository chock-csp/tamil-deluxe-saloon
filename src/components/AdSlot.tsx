'use client';

import React from 'react';

interface AdSlotProps {
  position: 'top' | 'below-player' | 'floating-sidebar' | 'footer';
  adSenseEnabled?: boolean;
  sponsorBannerEnabled?: boolean;
  adSensePublisherId?: string;
  customAdHtml?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  position,
  adSenseEnabled = true,
  sponsorBannerEnabled = true,
  customAdHtml,
}) => {
  if (!adSenseEnabled && !sponsorBannerEnabled) {
    return null;
  }

  return (
    <div className={`w-full mx-auto my-3 ${position === 'floating-sidebar' ? 'max-w-xs' : 'max-w-4xl'}`}>
      <div className="glass-panel rounded-2xl p-3 border border-amber-500/15 overflow-hidden text-center relative group">
        
        {/* Ad Label badge */}
        <div className="text-[9px] uppercase tracking-widest text-amber-400/40 mb-1 font-mono">
          Sponsored / Advertisement Slot
        </div>

        {customAdHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: customAdHtml }}
            className="text-amber-200 text-xs"
          />
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between p-2 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition">
            <div className="flex items-center space-x-3 text-left">
              <span className="text-xl">💈☕</span>
              <div>
                <h4 className="text-xs font-bold text-amber-200">
                  Tamil Deluxe Saloon & Tea Shop Radio
                </h4>
                <p className="text-[11px] text-amber-300/60">
                  90s & 2000s Kollywood Nostalgia • 24/7 Uninterrupted Daily Radio
                </p>
              </div>
            </div>

            <a
              href="/admin/login"
              className="mt-2 sm:mt-0 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition"
            >
              Sponsor This Slot
            </a>
          </div>
        )}

      </div>
    </div>
  );
};
