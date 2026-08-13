import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

function cleanYoutubeId(input: string): string {
  if (!input) return '';
  let id = input.trim();
  if (id.includes('list=')) {
    id = id.split('list=')[1].split('&')[0];
  }
  return id;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const playlists = await db.playlist.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ playlists });
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

    // 1. BATCH SAVE ALL 10 ROWS (ROBUST ORDER-BASED UPSERT)
    if (Array.isArray(body.rows)) {
      const savedPlaylists = [];

      for (let i = 0; i < body.rows.length; i++) {
        const item = body.rows[i];
        const youtubeId = cleanYoutubeId(item.youtubeId || '');
        const spotifyUrl = item.spotifyUrl || 'https://open.spotify.com';
        const ytMusicUrl =
          item.ytMusicUrl ||
          (youtubeId
            ? `https://music.youtube.com/playlist?list=${youtubeId}`
            : 'https://music.youtube.com');

        // Check if row exists by ID or by Order index
        let existing = null;
        if (item.id) {
          existing = await db.playlist.findUnique({ where: { id: item.id } });
        }
        if (!existing) {
          existing = await db.playlist.findFirst({ where: { order: i } });
        }

        if (existing) {
          const updated = await db.playlist.update({
            where: { id: existing.id },
            data: {
              title: item.title || `Row ${i + 1}`,
              youtubeId,
              spotifyUrl,
              ytMusicUrl,
              order: i,
              isActive: true,
            },
          });
          savedPlaylists.push(updated);
        } else {
          const created = await db.playlist.create({
            data: {
              title: item.title || `Row ${i + 1}`,
              description: item.description || '',
              youtubeId,
              spotifyUrl,
              ytMusicUrl,
              order: i,
              isActive: true,
            },
          });
          savedPlaylists.push(created);
        }
      }

      return NextResponse.json({ success: true, playlists: savedPlaylists });
    }

    // 2. SINGLE ITEM UPDATE FALLBACK
    const { id, title, youtubeId, spotifyUrl, ytMusicUrl, order } = body;
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID required' }, { status: 400 });
    }

    const cleanId = cleanYoutubeId(youtubeId);

    const playlist = await db.playlist.update({
      where: { id },
      data: {
        title,
        youtubeId: cleanId,
        spotifyUrl: spotifyUrl || 'https://open.spotify.com',
        ytMusicUrl:
          ytMusicUrl ||
          (cleanId
            ? `https://music.youtube.com/playlist?list=${cleanId}`
            : 'https://music.youtube.com'),
        order: order !== undefined ? Number(order) : 0,
      },
    });

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('API PUT error:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}
