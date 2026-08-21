import { buildSpotifySearchQuery } from '@/lib/track-match';

export interface SpotifyTrackMatch {
  query: string;
  title: string;
  uri: string | null;
  spotifyTitle?: string;
  spotifyArtist?: string;
  error?: string;
}

async function spotifyApi<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`https://api.spotify.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after') || '1');
    throw new Error(`Spotify rate limited. Retry after ${retryAfter}s`);
  }

  const json = (await res.json().catch(() => ({}))) as T & {
    error?: { message?: string; status?: number };
  };
  if (!res.ok) {
    throw new Error(json.error?.message || `Spotify API error (${res.status})`);
  }
  return json;
}

export async function getSpotifyProfile(
  accessToken: string
): Promise<{ id: string; displayName: string }> {
  const me = await spotifyApi<{ id: string; display_name?: string }>(
    accessToken,
    '/v1/me'
  );
  return { id: me.id, displayName: me.display_name || me.id };
}

export async function createOwnedSpotifyPlaylist(
  accessToken: string,
  title: string,
  description: string
): Promise<{ playlistId: string; url: string }> {
  const created = await spotifyApi<{ id?: string; external_urls?: { spotify?: string } }>(
    accessToken,
    '/v1/me/playlists',
    {
      method: 'POST',
      body: JSON.stringify({
        name: title.slice(0, 100),
        description: description.slice(0, 300),
        public: true,
      }),
    }
  );
  if (!created.id) throw new Error('Spotify did not return a playlist id');
  return {
    playlistId: created.id,
    url: created.external_urls?.spotify || `https://open.spotify.com/playlist/${created.id}`,
  };
}

export async function searchSpotifyTrack(
  accessToken: string,
  youtubeTitle: string
): Promise<SpotifyTrackMatch> {
  const query = buildSpotifySearchQuery(youtubeTitle);
  if (!query) {
    return { query: '', title: youtubeTitle, uri: null, error: 'Empty title' };
  }

  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: '5',
    market: 'IN',
  });

  try {
    const data = await spotifyApi<{
      tracks?: {
        items?: {
          uri: string;
          name: string;
          artists?: { name: string }[];
        }[];
      };
    }>(accessToken, `/v1/search?${params.toString()}`);

    const first = data.tracks?.items?.[0];
    if (!first?.uri) {
      return { query, title: youtubeTitle, uri: null, error: 'No Spotify match' };
    }
    return {
      query,
      title: youtubeTitle,
      uri: first.uri,
      spotifyTitle: first.name,
      spotifyArtist: first.artists?.map((a) => a.name).join(', '),
    };
  } catch (error) {
    return {
      query,
      title: youtubeTitle,
      uri: null,
      error: error instanceof Error ? error.message : 'Spotify search failed',
    };
  }
}

export async function addSpotifyTracks(
  accessToken: string,
  playlistId: string,
  uris: string[]
): Promise<void> {
  const unique = [...new Set(uris.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    await spotifyApi(accessToken, `/v1/playlists/${encodeURIComponent(playlistId)}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: chunk }),
    });
  }
}

export async function matchAndCollectSpotifyUris(
  accessToken: string,
  titles: string[]
): Promise<{ uris: string[]; matches: SpotifyTrackMatch[] }> {
  const matches: SpotifyTrackMatch[] = [];
  for (const title of titles) {
    matches.push(await searchSpotifyTrack(accessToken, title));
  }
  const uris = matches.map((m) => m.uri).filter((uri): uri is string => Boolean(uri));
  return { uris: [...new Set(uris)], matches };
}
