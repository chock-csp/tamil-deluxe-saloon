import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getStorageData, saveStorageData } from '@/lib/storage';
import { getOverrideFromEnv } from '@/lib/rotation';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = getStorageData();
  const envOverride = getOverrideFromEnv(data.rows || []);
  const effectiveIndex =
    envOverride !== null
      ? envOverride.index
      : (data.activeOverrideIndex !== null && data.activeOverrideIndex !== undefined
          ? data.activeOverrideIndex
          : null);

  const activeOverrideRow =
    effectiveIndex !== null && effectiveIndex >= 0 && data.rows[effectiveIndex]
      ? data.rows[effectiveIndex]
      : null;

  return NextResponse.json({
    settings: {
      activeOverridePlaylistId: activeOverrideRow?.id || null,
      activeOverrideIndex: effectiveIndex,
      isEnvOverride: envOverride !== null,
      envOverrideSource: envOverride?.source || null,
      liveListenerBase: data.liveListenerBase,
    },
  });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { activeOverridePlaylistId, activeOverrideIndex } = body;

    const data = getStorageData();
    let newIndex: number | null = null;

    if (typeof activeOverrideIndex === 'number') {
      newIndex = activeOverrideIndex;
    } else if (activeOverridePlaylistId) {
      const idx = data.rows.findIndex((r) => r.id === activeOverridePlaylistId);
      if (idx !== -1) newIndex = idx;
    }

    const updated = saveStorageData({ activeOverrideIndex: newIndex });

    return NextResponse.json({
      settings: {
        activeOverridePlaylistId:
          newIndex !== null ? updated.rows[newIndex]?.id : null,
        activeOverrideIndex: updated.activeOverrideIndex,
      },
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
