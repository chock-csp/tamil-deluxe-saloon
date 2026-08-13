import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

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

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, youtubeId, category, coverUrl, trackCount } = body;

    if (!title || !youtubeId) {
      return NextResponse.json(
        { error: 'Title and YouTube Playlist ID are required' },
        { status: 400 }
      );
    }

    const count = await db.playlist.count();

    const playlist = await db.playlist.create({
      data: {
        title,
        description: description || '',
        youtubeId,
        category: category || '90s Hits',
        coverUrl: coverUrl || null,
        trackCount: Number(trackCount) || 20,
        order: count,
        isActive: true,
      },
    });

    return NextResponse.json({ playlist });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Batch reorder
    if (Array.isArray(body.playlists)) {
      for (let i = 0; i < body.playlists.length; i++) {
        const p = body.playlists[i];
        await db.playlist.update({
          where: { id: p.id },
          data: { order: i, isActive: p.isActive },
        });
      }
      return NextResponse.json({ success: true });
    }

    // Single item update
    const { id, title, description, youtubeId, category, coverUrl, trackCount, isActive, order } = body;
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID required' }, { status: 400 });
    }

    const playlist = await db.playlist.update({
      where: { id },
      data: {
        title,
        description,
        youtubeId,
        category,
        coverUrl,
        trackCount: Number(trackCount),
        isActive,
        order,
      },
    });

    return NextResponse.json({ playlist });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    await db.playlist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
