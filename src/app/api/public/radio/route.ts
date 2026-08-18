import { NextResponse } from 'next/server';
import { getStorageData } from '@/lib/storage';
import { getOverrideFromEnv } from '@/lib/rotation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = getStorageData();
    const allRows = data.rows || [];

    if (allRows.length === 0) {
      return NextResponse.json(
        { error: 'No playlist rows configured' },
        { status: 404 }
      );
    }

    // Filter only active rows (or fallback to all if none active)
    const activeRows = allRows.filter((r) => r.isActive !== false);
    const pool = activeRows.length > 0 ? activeRows : allRows;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff =
      now.getTime() -
      startOfYear.getTime() +
      (startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    let featuredPlaylist = pool[0];
    let isOverride = false;
    let selectedIndex = dayOfYear % pool.length;
    let overrideSource: string | null = null;

    // 1. Check process.env for PLAYLIST_OVERRIDE_INDEX or PLAYLIST_OVERRIDE_ID
    const envOverride = getOverrideFromEnv(allRows);

    if (envOverride) {
      featuredPlaylist = allRows[envOverride.index];
      isOverride = true;
      selectedIndex = envOverride.index;
      overrideSource = envOverride.source;
    } else if (
      data.activeOverrideIndex !== null &&
      data.activeOverrideIndex !== undefined &&
      data.activeOverrideIndex >= 0 &&
      data.activeOverrideIndex < allRows.length
    ) {
      // Manual admin override from storage
      featuredPlaylist = allRows[data.activeOverrideIndex];
      isOverride = true;
      selectedIndex = data.activeOverrideIndex;
      overrideSource = 'json_storage';
    } else {
      // Algorithmic daily selection from active playlists pool (dayOfYear % pool.length)
      featuredPlaylist = pool[selectedIndex];
    }

    return NextResponse.json(
      {
        dayOfYear,
        todayIndex: selectedIndex,
        isOverride,
        overrideSource,
        activeCount: activeRows.length,
        featuredPlaylist,
        playlists: allRows,
        settings: {
          liveListenerBase: data.liveListenerBase || 48,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Public radio API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch radio config' },
      { status: 500 }
    );
  }
}
