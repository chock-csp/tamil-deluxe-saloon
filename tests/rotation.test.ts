import { describe, it, expect } from 'vitest';

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
    { id: 'p1', title: '90s Hits' },
    { id: 'p2', title: '2000s Melodies' },
    { id: 'p3', title: 'Gaana Specials' },
    { id: 'p4', title: 'Harris Magic' },
    { id: 'p5', title: '80s Classics' },
    { id: 'p6', title: 'Rainy Day Chill' },
    { id: 'p7', title: 'Mass Intros' },
    { id: 'p8', title: 'Acoustic Night' },
    { id: 'p9', title: '90s Duets' },
    { id: 'p10', title: '2000s Campus' },
  ];

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
});
