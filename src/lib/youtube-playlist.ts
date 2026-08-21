import { uniqueVideoIds } from '@/lib/track-match';

const INNERTUBE_BROWSE = 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false';
const INNERTUBE_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240815.00.00',
    hl: 'en',
    gl: 'US',
  },
};

export interface YoutubePlaylistTrack {
  videoId: string;
  title: string;
}

export interface YoutubePlaylistSnapshot {
  playlistId: string;
  title: string;
  tracks: YoutubePlaylistTrack[];
}

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Json)
    : null;
}

function walk(value: unknown, visit: (node: Json) => void) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  const rec = asRecord(value);
  if (!rec) return;
  visit(rec);
  for (const child of Object.values(rec)) walk(child, visit);
}

function titleFromLockup(node: Json): string {
  const metadata = asRecord(node.metadata);
  const view = asRecord(metadata?.lockupMetadataViewModel);
  const title = asRecord(view?.title);
  if (typeof title?.content === 'string') return title.content;
  return '';
}

function titleFromPlaylistVideo(node: Json): string {
  const title = asRecord(node.title);
  if (typeof title?.simpleText === 'string') return title.simpleText;
  const runs = Array.isArray(title?.runs) ? title.runs : [];
  const first = asRecord(runs[0]);
  return typeof first?.text === 'string' ? first.text : '';
}

export function collectPlaylistVideosFromBrowseResponse(data: unknown): {
  title: string;
  tracks: YoutubePlaylistTrack[];
  continuation: string | null;
} {
  let title = '';
  const tracks: YoutubePlaylistTrack[] = [];
  let continuation: string | null = null;

  walk(data, (node) => {
    const meta = asRecord(node.playlistMetadataRenderer);
    if (meta && typeof meta.title === 'string' && !title) {
      title = meta.title;
    }

    const micro = asRecord(node.microformatDataRenderer);
    if (micro && typeof micro.title === 'string' && !title) {
      title = micro.title;
    }

    const lockup = asRecord(node.lockupViewModel);
    if (lockup && typeof lockup.contentId === 'string') {
      const contentType = String(lockup.contentType || '');
      if (!contentType || contentType.includes('VIDEO')) {
        tracks.push({
          videoId: lockup.contentId,
          title: titleFromLockup(lockup),
        });
      }
    }

    const video = asRecord(node.playlistVideoRenderer);
    if (video && typeof video.videoId === 'string') {
      tracks.push({
        videoId: video.videoId,
        title: titleFromPlaylistVideo(video),
      });
    }

    const endpoint = asRecord(node.continuationEndpoint) || asRecord(node.continuationCommand);
    const command = asRecord(endpoint?.continuationCommand) || endpoint;
    if (command && typeof command.token === 'string' && !continuation) {
      continuation = command.token;
    }
  });

  const unique = uniqueVideoIds(tracks.map((t) => t.videoId));
  const byId = new Map(tracks.map((t) => [t.videoId, t]));
  return {
    title,
    tracks: unique.map((id) => byId.get(id)!),
    continuation,
  };
}

async function innertubeBrowse(body: Json): Promise<unknown> {
  const res = await fetch(INNERTUBE_BROWSE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`YouTube playlist lookup failed (${res.status})`);
  }
  return res.json();
}

export async function fetchPublicYoutubePlaylist(
  playlistId: string,
  options?: { maxTracks?: number }
): Promise<YoutubePlaylistSnapshot> {
  const maxTracks = options?.maxTracks ?? 400;
  const first = await innertubeBrowse({
    context: INNERTUBE_CONTEXT,
    browseId: `VL${playlistId}`,
  });

  const collected = collectPlaylistVideosFromBrowseResponse(first);
  const tracks = [...collected.tracks];
  let continuation = collected.continuation;
  let pages = 0;

  while (continuation && tracks.length < maxTracks && pages < 20) {
    pages += 1;
    const next = await innertubeBrowse({
      context: INNERTUBE_CONTEXT,
      continuation,
    });
    const page = collectPlaylistVideosFromBrowseResponse(next);
    if (page.tracks.length === 0) break;
    const seen = new Set(tracks.map((t) => t.videoId));
    for (const track of page.tracks) {
      if (seen.has(track.videoId)) continue;
      seen.add(track.videoId);
      tracks.push(track);
      if (tracks.length >= maxTracks) break;
    }
    continuation = page.continuation && page.continuation !== continuation ? page.continuation : null;
  }

  if (tracks.length === 0) {
    throw new Error(
      'Could not read that YouTube playlist. It may be private, a YouTube Mix (RD…), or unavailable via API clone.'
    );
  }

  return {
    playlistId,
    title: collected.title || 'Imported playlist',
    tracks: tracks.slice(0, maxTracks),
  };
}

async function youtubeApi<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as T & {
    error?: { message?: string; errors?: { reason?: string }[] };
  };
  if (!res.ok) {
    const reason = json.error?.errors?.[0]?.reason || '';
    const message = json.error?.message || `YouTube API error (${res.status})`;
    if (reason === 'quotaExceeded') {
      throw new Error('YouTube API quota exceeded. Try again tomorrow or add fewer videos.');
    }
    if (reason === 'youtubeSignupRequired') {
      throw new Error('This Google account does not have a YouTube channel yet. Create one, then reconnect.');
    }
    throw new Error(message);
  }
  return json;
}

export async function createOwnedYoutubePlaylist(
  accessToken: string,
  title: string,
  description: string
): Promise<{ playlistId: string; url: string }> {
  const created = await youtubeApi<{ id?: string }>(
    accessToken,
    'playlists?part=snippet,status',
    {
      method: 'POST',
      body: JSON.stringify({
        snippet: {
          title: title.slice(0, 100),
          description: description.slice(0, 5000),
        },
        status: { privacyStatus: 'public' },
      }),
    }
  );
  if (!created.id) throw new Error('YouTube did not return a playlist id');
  return {
    playlistId: created.id,
    url: `https://www.youtube.com/playlist?list=${created.id}`,
  };
}

export async function addVideosToYoutubePlaylist(
  accessToken: string,
  playlistId: string,
  videoIds: string[]
): Promise<{ added: string[]; skipped: { videoId: string; error: string }[] }> {
  const added: string[] = [];
  const skipped: { videoId: string; error: string }[] = [];

  for (const videoId of uniqueVideoIds(videoIds)) {
    try {
      await youtubeApi(accessToken, 'playlistItems?part=snippet', {
        method: 'POST',
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId,
            },
          },
        }),
      });
      added.push(videoId);
    } catch (error) {
      skipped.push({
        videoId,
        error: error instanceof Error ? error.message : 'Failed to add video',
      });
    }
  }

  return { added, skipped };
}
