import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let settings = await db.siteSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await db.siteSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      activeOverridePlaylistId,
      liveListenerBase,
      sponsorBannerEnabled,
      adSenseEnabled,
      adSensePublisherId,
      bannerText,
      customAdHtml,
      spotifyUrl,
      ytMusicUrl,
    } = body;

    const settings = await db.siteSettings.upsert({
      where: { id: 'default' },
      update: {
        activeOverridePlaylistId: activeOverridePlaylistId || null,
        liveListenerBase: liveListenerBase !== undefined ? Number(liveListenerBase) : 48,
        sponsorBannerEnabled: Boolean(sponsorBannerEnabled),
        adSenseEnabled: Boolean(adSenseEnabled),
        adSensePublisherId: adSensePublisherId || '',
        bannerText: bannerText || '',
        customAdHtml: customAdHtml || '',
        spotifyUrl: spotifyUrl || '',
        ytMusicUrl: ytMusicUrl || '',
      },
      create: {
        id: 'default',
        activeOverridePlaylistId: activeOverridePlaylistId || null,
        liveListenerBase: liveListenerBase !== undefined ? Number(liveListenerBase) : 48,
        sponsorBannerEnabled: Boolean(sponsorBannerEnabled),
        adSenseEnabled: Boolean(adSenseEnabled),
        adSensePublisherId: adSensePublisherId || '',
        bannerText: bannerText || '',
        customAdHtml: customAdHtml || '',
        spotifyUrl: spotifyUrl || '',
        ytMusicUrl: ytMusicUrl || '',
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
