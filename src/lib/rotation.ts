export interface PlaylistRowItem {
  id?: string;
  order: number;
  title: string;
  youtubeId: string;
  spotifyUrl: string;
  ytMusicUrl: string;
  isActive: boolean;
}

export interface EnvOverrideResult {
  index: number;
  source: 'PLAYLIST_OVERRIDE_INDEX' | 'PLAYLIST_OVERRIDE_ID';
}

export function getOverrideFromEnv(allRows: PlaylistRowItem[]): EnvOverrideResult | null {
  if (typeof process === 'undefined' || !process.env) return null;

  const envIndexStr = process.env.PLAYLIST_OVERRIDE_INDEX;
  if (envIndexStr !== undefined && envIndexStr !== null && envIndexStr.trim() !== '') {
    const parsed = parseInt(envIndexStr.trim(), 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < allRows.length) {
      return { index: parsed, source: 'PLAYLIST_OVERRIDE_INDEX' };
    }
  }

  const envIdStr = process.env.PLAYLIST_OVERRIDE_ID;
  if (envIdStr && envIdStr.trim() !== '') {
    const targetId = envIdStr.trim();
    const idx = allRows.findIndex(
      (r) => r.id === targetId || (r.youtubeId && r.youtubeId === targetId)
    );
    if (idx !== -1) {
      return { index: idx, source: 'PLAYLIST_OVERRIDE_ID' };
    }
  }

  return null;
}
