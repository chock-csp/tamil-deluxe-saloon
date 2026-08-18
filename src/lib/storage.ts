import fs from 'fs';
import path from 'path';

export interface PlaylistRowItem {
  id?: string;
  order: number;
  title: string;
  youtubeId: string;
  spotifyUrl: string;
  ytMusicUrl: string;
  isActive: boolean;
}

export interface PlaylistsStorageSchema {
  activeOverrideIndex: number | null;
  liveListenerBase: number;
  rows: PlaylistRowItem[];
}

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'playlists.json');

function cleanYoutubeId(input: string): string {
  if (!input) return '';
  let id = input.trim();
  if (id.includes('list=')) {
    id = id.split('list=')[1].split('&')[0];
  }
  return id;
}

function getKvConfig() {
  if (typeof process === 'undefined' || !process.env) return null;
  const url =
    process.env.KV_REST_API_URL ||
    process.env.VERCEL_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.VERCEL_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.trim().replace(/\/$/, ''), token: token.trim() };
  }
  return null;
}

const defaultRows: Omit<PlaylistRowItem, 'id'>[] = [
  {
    order: 0,
    title: 'Row 1 - 90s Evergreen Saloon Hits',
    youtubeId: 'PLPeMc_mgX1mlflEDmd523UJ5oDd74H6g8',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXa7aEa6s0nQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PLPeMc_mgX1mlflEDmd523UJ5oDd74H6g8',
    isActive: true,
  },
  {
    order: 1,
    title: 'Row 2 - 2000s Tea Kadai Melodies',
    youtubeId: 'PLV_X8rZ20K4qY_F8K5t5d5z5e5r5t5y5',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWYw4K5a5e5r5',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PLV_X8rZ20K4qY_F8K5t5d5z5e5r5t5y5',
    isActive: true,
  },
  {
    order: 2,
    title: 'Row 3 - Mass Kuthu & Deva Gaana Special',
    youtubeId: 'PL7dJzW4d3mX9_k8Y7z6W5v4U3t2S1r0',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4t2S1r0nQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL7dJzW4d3mX9_k8Y7z6W5v4U3t2S1r0',
    isActive: true,
  },
  {
    order: 3,
    title: 'Row 4 - Harris Jayaraj & Yuvan Barber Shop Magic',
    youtubeId: 'PL8Y3Z2W1X0_9V8U7T6S5R4Q3P2O1N',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX3P2O1NnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL8Y3Z2W1X0_9V8U7T6S5R4Q3P2O1N',
    isActive: true,
  },
  {
    order: 4,
    title: 'Row 5 - 80s Vintage Radio Classics',
    youtubeId: 'PL0A1B2C3D4E5F6G7H8I9J0K1L2M3N',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX1L2M3NnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL0A1B2C3D4E5F6G7H8I9J0K1L2M3N',
    isActive: true,
  },
  {
    order: 5,
    title: 'Row 6 - Rainy Day Tea Shop Chill',
    youtubeId: 'PL9M8N7O6P5Q4R3S2T1U0V9W8X7Y6Z',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8X7Y6ZnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL9M8N7O6P5Q4R3S2T1U0V9W8X7Y6Z',
    isActive: true,
  },
  {
    order: 6,
    title: 'Row 7 - Superstar & Thala-Thalapathy Mass Intros',
    youtubeId: 'PL1a2b3c4d5e6f7g8h9i0j1k2l3m4n',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2l3m4nnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL1a2b3c4d5e6f7g8h9i0j1k2l3m4n',
    isActive: true,
  },
  {
    order: 7,
    title: 'Row 8 - Midnight Saloon Acoustic Hits',
    youtubeId: 'PL5n6m7l8k9j0i1h2g3f4e5d6c7b8a',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX6c7b8anQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL5n6m7l8k9j0i1h2g3f4e5d6c7b8a',
    isActive: true,
  },
  {
    order: 8,
    title: 'Row 9 - 90s Kollywood Romantic Duets',
    youtubeId: 'PLz1y2x3w4v5u6t7s8r9q0p1o2n3m4',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX1o2n3mnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PLz1y2x3w4v5u6t7s8r9q0p1o2n3m4',
    isActive: true,
  },
  {
    order: 9,
    title: 'Row 10 - 2000s Nostalgic College Hits',
    youtubeId: 'PL4a3b2c1d0e9f8g7h6i5j4k3l2m1n',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX3l2m1nnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL4a3b2c1d0e9f8g7h6i5j4k3l2m1n',
    isActive: true,
  },
];

function sanitizeSchema(json: PlaylistsStorageSchema): PlaylistsStorageSchema {
  const rows = Array.isArray(json.rows) ? json.rows : [];
  const sanitizedRows = rows.map((row, idx) => {
    const yId = cleanYoutubeId(row.youtubeId || '');
    return {
      id: `row-${idx + 1}`,
      order: idx,
      title: row.title || `Row ${idx + 1}`,
      youtubeId: yId,
      spotifyUrl: row.spotifyUrl || 'https://open.spotify.com',
      ytMusicUrl:
        row.ytMusicUrl ||
        (yId
          ? `https://music.youtube.com/playlist?list=${yId}`
          : 'https://music.youtube.com'),
      isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
    };
  });

  return {
    activeOverrideIndex:
      json.activeOverrideIndex !== undefined ? json.activeOverrideIndex : null,
    liveListenerBase: json.liveListenerBase || 48,
    rows: sanitizedRows,
  };
}

export function getStorageData(): PlaylistsStorageSchema {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const json: PlaylistsStorageSchema = JSON.parse(content);
      if (json && Array.isArray(json.rows) && json.rows.length > 0) {
        return sanitizeSchema(json);
      }
    }
  } catch (error) {
    console.error('Failed reading playlists.json, falling back to defaults:', error);
  }

  const defaultSchema: PlaylistsStorageSchema = {
    activeOverrideIndex: null,
    liveListenerBase: 48,
    rows: defaultRows.map((r, idx) => ({ ...r, id: `row-${idx + 1}` })),
  };

  saveStorageData(defaultSchema);
  return defaultSchema;
}

export async function getStorageDataAsync(): Promise<PlaylistsStorageSchema> {
  const kv = getKvConfig();
  if (kv) {
    try {
      const res = await fetch(`${kv.url}/get/saloon_playlists_schema`, {
        headers: {
          Authorization: `Bearer ${kv.token}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          const parsed: PlaylistsStorageSchema =
            typeof data.result === 'string'
              ? JSON.parse(data.result)
              : data.result;
          if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
            return sanitizeSchema(parsed);
          }
        }
      }
    } catch (e) {
      console.error('Vercel KV read error, falling back to local storage:', e);
    }
  }

  return getStorageData();
}

export function saveStorageData(data: Partial<PlaylistsStorageSchema>): PlaylistsStorageSchema {
  const current = getStorageData();

  const newRows = Array.isArray(data.rows)
    ? data.rows.slice(0, 10).map((r, idx) => {
        const yId = cleanYoutubeId(r.youtubeId || '');
        return {
          id: `row-${idx + 1}`,
          order: idx,
          title: r.title || `Row ${idx + 1}`,
          youtubeId: yId,
          spotifyUrl: r.spotifyUrl || 'https://open.spotify.com',
          ytMusicUrl:
            r.ytMusicUrl ||
            (yId
              ? `https://music.youtube.com/playlist?list=${yId}`
              : 'https://music.youtube.com'),
          isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
        };
      })
    : current.rows;

  const updated: PlaylistsStorageSchema = {
    activeOverrideIndex:
      data.activeOverrideIndex !== undefined
        ? data.activeOverrideIndex
        : current.activeOverrideIndex,
    liveListenerBase:
      data.liveListenerBase !== undefined
        ? data.liveListenerBase
        : current.liveListenerBase,
    rows: newRows,
  };

  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write playlists.json:', error);
  }

  return updated;
}

export async function saveStorageDataAsync(
  data: Partial<PlaylistsStorageSchema>
): Promise<PlaylistsStorageSchema> {
  const current = await getStorageDataAsync();

  const newRows = Array.isArray(data.rows)
    ? data.rows.slice(0, 10).map((r, idx) => {
        const yId = cleanYoutubeId(r.youtubeId || '');
        return {
          id: `row-${idx + 1}`,
          order: idx,
          title: r.title || `Row ${idx + 1}`,
          youtubeId: yId,
          spotifyUrl: r.spotifyUrl || 'https://open.spotify.com',
          ytMusicUrl:
            r.ytMusicUrl ||
            (yId
              ? `https://music.youtube.com/playlist?list=${yId}`
              : 'https://music.youtube.com'),
          isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
        };
      })
    : current.rows;

  const updated: PlaylistsStorageSchema = {
    activeOverrideIndex:
      data.activeOverrideIndex !== undefined
        ? data.activeOverrideIndex
        : current.activeOverrideIndex,
    liveListenerBase:
      data.liveListenerBase !== undefined
        ? data.liveListenerBase
        : current.liveListenerBase,
    rows: newRows,
  };

  const kv = getKvConfig();
  if (kv) {
    try {
      await fetch(`${kv.url}/set/saloon_playlists_schema`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.stringify(updated)),
        cache: 'no-store',
      });
    } catch (e) {
      console.error('Vercel KV write error:', e);
    }
  }

  saveStorageData(updated);
  return updated;
}
