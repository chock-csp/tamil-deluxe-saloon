import { NextResponse } from 'next/server';
import { getStorageData } from '@/lib/storage';

export async function GET() {
  try {
    const data = getStorageData();
    const playlists = data.rows || [];

    if (playlists.length === 0) {
      return NextResponse.json(
        { error: 'No playlist rows configured' },
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

    let selectedIndex = dayOfYear % playlists.length;
    let isOverride = false;

    if (
      data.activeOverrideIndex !== null &&
      data.activeOverrideIndex !== undefined &&
      data.activeOverrideIndex >= 0 &&
      data.activeOverrideIndex < playlists.length
    ) {
      selectedIndex = data.activeOverrideIndex;
      isOverride = true;
    }

    const featuredPlaylist = playlists[selectedIndex] || playlists[0];

    return NextResponse.json({
      dayOfYear,
      todayIndex: selectedIndex,
      isOverride,
      featuredPlaylist,
      playlists,
      settings: {
        liveListenerBase: data.liveListenerBase || 48,
      },
    });
  } catch (error) {
    console.error('Public radio API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch radio config' },
      { status: 500 }
    );
  }
}
