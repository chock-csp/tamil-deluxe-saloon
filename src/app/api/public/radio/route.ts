import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.siteSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await db.siteSettings.create({
        data: {
          id: 'default',
          liveListenerBase: 48,
          sponsorBannerEnabled: true,
          adSenseEnabled: true,
          bannerText: 'வணக்கம்! தமிழ் டீ கடை & சலூன் 90s/2000s Hits 💈☕ 24/7 Retro Radio',
        },
      });
    }

    const playlists = await db.playlist.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    if (playlists.length === 0) {
      return NextResponse.json(
        { error: 'No playlists configured' },
        { status: 404 }
      );
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff =
      now.getTime() -
      startOfYear.getTime() +
      (startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    let featuredPlaylist = null;
    let selectedIndex = dayOfYear % playlists.length;

    if (settings.activeOverridePlaylistId) {
      const overridePlaylist = playlists.find(
        (p) => p.id === settings.activeOverridePlaylistId
      );
      if (overridePlaylist) {
        featuredPlaylist = overridePlaylist;
        selectedIndex = playlists.findIndex(
          (p) => p.id === settings.activeOverridePlaylistId
        );
      }
    }

    if (!featuredPlaylist) {
      featuredPlaylist = playlists[selectedIndex] || playlists[0];
    }

    return NextResponse.json({
      dayOfYear,
      todayIndex: selectedIndex,
      isOverride: Boolean(settings.activeOverridePlaylistId),
      featuredPlaylist,
      playlists,
      settings: {
        bannerText: settings.bannerText,
        liveListenerBase: settings.liveListenerBase,
        sponsorBannerEnabled: settings.sponsorBannerEnabled,
        adSenseEnabled: settings.adSenseEnabled,
        adSensePublisherId: settings.adSensePublisherId,
        customAdHtml: settings.customAdHtml,
        spotifyUrl: settings.spotifyUrl,
        ytMusicUrl: settings.ytMusicUrl,
      },
    });
  } catch (error) {
    console.error('Radio API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch radio configuration' },
      { status: 500 }
    );
  }
}
