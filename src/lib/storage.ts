import fs from 'fs';
import path from 'path';

export interface PlaylistRowItem {
  id?: string;
  order: number;
  title: string;
  youtubeId: string;
  spotifyUrl: string;
  ytMusicUrl: string;
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

const defaultRows: PlaylistRowItem[] = [
  {
    order: 0,
    title: 'Row 1 - 90s Evergreen Saloon Hits',
    youtubeId: 'PLPeMc_mgX1mlflEDmd523UJ5oDd74H6g8',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXa7aEa6s0nQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PLPeMc_mgX1mlflEDmd523UJ5oDd74H6g8',
  },
  {
    order: 1,
    title: 'Row 2 - 2000s Tea Kadai Melodies',
    youtubeId: 'PLV_X8rZ20K4qY_F8K5t5d5z5e5r5t5y5',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWYw4K5a5e5r5',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PLV_X8rZ20K4qY_F8K5t5d5z5e5r5t5y5',
  },
  {
    order: 2,
    title: 'Row 3 - Mass Kuthu & Deva Gaana Special',
    youtubeId: 'PL7dJzW4d3mX9_k8Y7z6W5v4U3t2S1r0',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4t2S1r0nQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL7dJzW4d3mX9_k8Y7z6W5v4U3t2S1r0',
  },
  {
    order: 3,
    title: 'Row 4 - Harris Jayaraj & Yuvan Barber Shop Magic',
    youtubeId: 'PL8Y3Z2W1X0_9V8U7T6S5R4Q3P2O1N',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX3P2O1NnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL8Y3Z2W1X0_9V8U7T6S5R4Q3P2O1N',
  },
  {
    order: 4,
    title: 'Row 5 - 80s Vintage Radio Classics',
    youtubeId: 'PL0A1B2C3D4E5F6G7H8I9J0K1L2M3N',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX1L2M3NnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL0A1B2C3D4E5F6G7H8I9J0K1L2M3N',
  },
  {
    order: 5,
    title: 'Row 6 - Rainy Day Tea Shop Chill',
    youtubeId: 'PL9M8N7O6P5Q4R3S2T1U0V9W8X7Y6Z',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8X7Y6ZnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL9M8N7O6P5Q4R3S2T1U0V9W8X7Y6Z',
  },
  {
    order: 6,
    title: 'Row 7 - Superstar & Thala-Thalapathy Mass Intros',
    youtubeId: 'PL1a2b3c4d5e6f7g8h9i0j1k2l3m4n',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2l3m4nnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL1a2b3c4d5e6f7g8h9i0j1k2l3m4n',
  },
  {
    order: 7,
    title: 'Row 8 - Midnight Saloon Acoustic Hits',
    youtubeId: 'PL5n6m7l8k9j0i1h2g3f4e5d6c7b8a',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX6c7b8anQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL5n6m7l8k9j0i1h2g3f4e5d6c7b8a',
  },
  {
    order: 8,
    title: 'Row 9 - 90s Kollywood Romantic Duets',
    youtubeId: 'PLz1y2x3w4v5u6t7s8r9q0p1o2n3m4',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX1o2n3mnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PLz1y2x3w4v5u6t7s8r9q0p1o2n3m4',
  },
  {
    order: 9,
    title: 'Row 10 - 2000s Nostalgic College Hits',
    youtubeId: 'PL4a3b2c1d0e9f8g7h6i5j4k3l2m1n',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX3l2m1nnQe',
    ytMusicUrl: 'https://music.youtube.com/playlist?list=PL4a3b2c1d0e9f8g7h6i5j4k3l2m1n',
  },
];

export function getStorageData(): PlaylistsStorageSchema {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const json: PlaylistsStorageSchema = JSON.parse(content);
      if (json && Array.isArray(json.rows) && json.rows.length > 0) {
        // Ensure IDs & YouTube URLs are sanitized
        json.rows = json.rows.map((row, idx) => {
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
          };
        });
        return json;
      }
    }
  } catch (error) {
    console.error('Failed reading playlists.json, falling back to defaults:', error);
  }

  const defaultSchema: PlaylistsStorageSchema = {
    activeOverrideIndex: 0,
    liveListenerBase: 48,
    rows: defaultRows.map((r, idx) => ({ ...r, id: `row-${idx + 1}` })),
  };

  saveStorageData(defaultSchema);
  return defaultSchema;
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
