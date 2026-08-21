import { NextResponse } from 'next/server';
import {
  getAdminSession,
  requireAdminWithCsrf,
  requireJsonContentType,
} from '@/lib/auth';
import {
  getFreshSpotifyTokens,
  getFreshYoutubeTokens,
  googleClientConfig,
  spotifyClientConfig,
  writeTokenCookie,
  SPOTIFY_COOKIE,
  YOUTUBE_COOKIE,
} from '@/lib/oauth';
import { extractYoutubePlaylistId } from '@/lib/track-match';
import {
  addVideosToYoutubePlaylist,
  createOwnedYoutubePlaylist,
  fetchPublicYoutubePlaylist,
} from '@/lib/youtube-playlist';
import {
  addSpotifyTracks,
  createOwnedSpotifyPlaylist,
  matchAndCollectSpotifyUris,
} from '@/lib/spotify-playlist';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const youtube = googleClientConfig();
  const spotify = spotifyClientConfig();
  const ytTokens = await getFreshYoutubeTokens();
  const spTokens = await getFreshSpotifyTokens();

  return NextResponse.json({
    youtube: {
      configured: youtube.configured,
      connected: Boolean(ytTokens),
      name: ytTokens?.displayName || null,
    },
    spotify: {
      configured: spotify.configured,
      connected: Boolean(spTokens),
      name: spTokens?.displayName || null,
    },
    callbacks: {
      youtube: '/api/oauth/youtube/callback',
      spotify: '/api/oauth/spotify/callback',
    },
  });
}

export async function POST(request: Request) {
  const ctError = requireJsonContentType(request);
  if (ctError) return ctError;

  const session = await requireAdminWithCsrf(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '');

  try {
    if (action === 'disconnect') {
      const provider = String(body.provider || '');
      if (provider === 'youtube') await writeTokenCookie(YOUTUBE_COOKIE, null);
      else if (provider === 'spotify') await writeTokenCookie(SPOTIFY_COOKIE, null);
      else {
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'preview') {
      const playlistId = extractYoutubePlaylistId(String(body.source || ''));
      if (!playlistId) {
        return NextResponse.json(
          { error: 'Paste a public YouTube playlist URL or ID' },
          { status: 400 }
        );
      }
      const snapshot = await fetchPublicYoutubePlaylist(playlistId);
      return NextResponse.json({
        playlistId: snapshot.playlistId,
        title: snapshot.title,
        trackCount: snapshot.tracks.length,
        tracks: snapshot.tracks,
      });
    }

    if (action === 'youtube-create') {
      const tokens = await getFreshYoutubeTokens();
      if (!tokens) {
        return NextResponse.json({ error: 'Connect YouTube first' }, { status: 401 });
      }
      const title = String(body.title || '').trim();
      if (!title) {
        return NextResponse.json({ error: 'Playlist title is required' }, { status: 400 });
      }
      const sourceId = extractYoutubePlaylistId(String(body.sourcePlaylistId || '')) || '';
      const description = sourceId
        ? `Cloned for Tamil Deluxe Saloon from https://www.youtube.com/playlist?list=${sourceId}`
        : 'Created by Tamil Deluxe Saloon';
      const created = await createOwnedYoutubePlaylist(tokens.accessToken, title, description);
      return NextResponse.json(created);
    }

    if (action === 'youtube-items') {
      const tokens = await getFreshYoutubeTokens();
      if (!tokens) {
        return NextResponse.json({ error: 'Connect YouTube first' }, { status: 401 });
      }
      const playlistId = String(body.playlistId || '');
      const videoIds = Array.isArray(body.videoIds) ? body.videoIds.map(String) : [];
      if (!playlistId || videoIds.length === 0) {
        return NextResponse.json({ error: 'playlistId and videoIds are required' }, { status: 400 });
      }
      const result = await addVideosToYoutubePlaylist(
        tokens.accessToken,
        playlistId,
        videoIds.slice(0, 10)
      );
      return NextResponse.json(result);
    }

    if (action === 'spotify-create') {
      const tokens = await getFreshSpotifyTokens();
      if (!tokens) {
        return NextResponse.json({ error: 'Connect Spotify first' }, { status: 401 });
      }
      const title = String(body.title || '').trim();
      if (!title) {
        return NextResponse.json({ error: 'Playlist title is required' }, { status: 400 });
      }
      const created = await createOwnedSpotifyPlaylist(
        tokens.accessToken,
        title,
        'Cloned from a YouTube playlist by Tamil Deluxe Saloon'
      );
      return NextResponse.json(created);
    }

    if (action === 'spotify-tracks') {
      const tokens = await getFreshSpotifyTokens();
      if (!tokens) {
        return NextResponse.json({ error: 'Connect Spotify first' }, { status: 401 });
      }
      const playlistId = String(body.playlistId || '');
      const titles = Array.isArray(body.titles) ? body.titles.map(String) : [];
      if (!playlistId || titles.length === 0) {
        return NextResponse.json({ error: 'playlistId and titles are required' }, { status: 400 });
      }
      const { uris, matches } = await matchAndCollectSpotifyUris(
        tokens.accessToken,
        titles.slice(0, 8)
      );
      if (uris.length > 0) {
        await addSpotifyTracks(tokens.accessToken, playlistId, uris);
      }
      return NextResponse.json({
        added: uris.length,
        matches,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Playlist import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
