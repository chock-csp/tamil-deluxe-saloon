import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let id = searchParams.get('id') || searchParams.get('url') || '';

  if (id.includes('list=')) {
    id = id.split('list=')[1].split('&')[0];
  }

  // Allow only characters that appear in real YouTube playlist IDs
  const sanitizedId = id.replace(/[^A-Za-z0-9_-]/g, '');

  if (!sanitizedId) {
    return NextResponse.json({ error: 'YouTube playlist ID or URL required' }, { status: 400 });
  }

  // Reuse sanitized id from here on
  id = sanitizedId;

  try {
    // Attempt oEmbed API for YouTube Playlist
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${id}&format=json`;
    const res = await fetch(oembedUrl);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        youtubeId: id,
        title: data.title || 'Tamil Deluxe Playlist',
        authorName: data.author_name || 'Tamil Saloon Radio',
        thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      });
    }

    return NextResponse.json({
      youtubeId: id,
      title: `Tamil Hits Playlist (${id.substring(0, 8)}…)`,
      authorName: 'Tamil Deluxe Saloon',
      thumbnailUrl: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80`,
    });
  } catch (error) {
    return NextResponse.json({
      youtubeId: id,
      title: 'Tamil Playlist Preview',
      authorName: 'Tamil Radio',
      thumbnailUrl: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=600&q=80',
    });
  }
}
