import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getOverrideFromEnv } from '@/lib/rotation';

function calculateDailyPlaylistIndex(dayOfYear: number, totalPlaylists: number): number {
  if (totalPlaylists <= 0) return 0;
  return dayOfYear % totalPlaylists;
}

function resolveActivePlaylist<T extends { id: string }>(
  playlists: T[],
  dayOfYear: number,
  overrideId?: string | null
): { playlist: T; index: number; isOverride: boolean } {
  if (overrideId) {
    const foundIndex = playlists.findIndex((p) => p.id === overrideId);
    if (foundIndex !== -1) {
      return {
        playlist: playlists[foundIndex],
        index: foundIndex,
        isOverride: true,
      };
    }
  }

  const index = calculateDailyPlaylistIndex(dayOfYear, playlists.length);
  return {
    playlist: playlists[index] || playlists[0],
    index,
    isOverride: false,
  };
}

describe('Daily 10-Playlist Rotational Logic', () => {
  const samplePlaylists = [
    { id: 'p1', title: '90s Hits', order: 0, youtubeId: 'yt1', spotifyUrl: '', ytMusicUrl: '', isActive: true },
    { id: 'p2', title: '2000s Melodies', order: 1, youtubeId: 'yt2', spotifyUrl: '', ytMusicUrl: '', isActive: true },
    { id: 'p3', title: 'Gaana Specials', order: 2, youtubeId: 'yt3', spotifyUrl: '', ytMusicUrl: '', isActive: true },
    { id: 'p4', title: 'Harris Magic', order: 3, youtubeId: 'yt4', spotifyUrl: '', ytMusicUrl: '', isActive: true },
    { id: 'p5', title: '80s Classics', order: 4, youtubeId: 'yt5', spotifyUrl: '', ytMusicUrl: '', isActive: true },
    { id: 'p6', title: 'Rainy Day Chill', order: 5, youtubeId: 'yt6', spotifyUrl: '', ytMusicUrl: '', isActive: true },
    { id: 'p7', title: 'Mass Intros', order: 6, youtubeId: 'yt7', spotifyUrl: '', ytMusicUrl: '', isActive: true },
    { id: 'p8', title: 'Acoustic Night', order: 7, youtubeId: 'yt8', spotifyUrl: '', ytMusicUrl: '', isActive: true },
    { id: 'p9', title: '90s Duets', order: 8, youtubeId: 'yt9', spotifyUrl: '', ytMusicUrl: '', isActive: true },
    { id: 'p10', title: '2000s Campus', order: 9, youtubeId: 'yt10', spotifyUrl: '', ytMusicUrl: '', isActive: true },
  ];

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PLAYLIST_OVERRIDE_INDEX;
    delete process.env.PLAYLIST_OVERRIDE_ID;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should rotate through playlists based on day of year mod 10', () => {
    expect(calculateDailyPlaylistIndex(0, 10)).toBe(0);
    expect(calculateDailyPlaylistIndex(1, 10)).toBe(1);
    expect(calculateDailyPlaylistIndex(9, 10)).toBe(9);
    expect(calculateDailyPlaylistIndex(10, 10)).toBe(0);
    expect(calculateDailyPlaylistIndex(225, 10)).toBe(5); // Day 225 maps to index 5
  });

  it('should select playlist matching calendar day index when no override is set', () => {
    const result = resolveActivePlaylist(samplePlaylists, 225, null);
    expect(result.index).toBe(5);
    expect(result.playlist.title).toBe('Rainy Day Chill');
    expect(result.isOverride).toBe(false);
  });

  it('should respect admin active playlist override over calendar rotation', () => {
    const result = resolveActivePlaylist(samplePlaylists, 225, 'p3');
    expect(result.index).toBe(2);
    expect(result.playlist.title).toBe('Gaana Specials');
    expect(result.isOverride).toBe(true);
  });

  it('should pick manual override from PLAYLIST_OVERRIDE_INDEX env var', () => {
    process.env.PLAYLIST_OVERRIDE_INDEX = '3';
    const override = getOverrideFromEnv(samplePlaylists);
    expect(override).not.toBeNull();
    expect(override?.index).toBe(3);
    expect(override?.source).toBe('PLAYLIST_OVERRIDE_INDEX');
  });

  it('should pick manual override from PLAYLIST_OVERRIDE_ID env var', () => {
    process.env.PLAYLIST_OVERRIDE_ID = 'p4';
    const override = getOverrideFromEnv(samplePlaylists);
    expect(override).not.toBeNull();
    expect(override?.index).toBe(3);
    expect(override?.source).toBe('PLAYLIST_OVERRIDE_ID');
  });
});
