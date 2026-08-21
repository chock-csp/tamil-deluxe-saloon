import { describe, it, expect } from 'vitest';
import {
  buildSpotifySearchQuery,
  cleanYoutubeTitleForSearch,
  extractYoutubePlaylistId,
} from '../src/lib/track-match';

describe('extractYoutubePlaylistId', () => {
  it('reads list= from a watch or playlist URL', () => {
    expect(
      extractYoutubePlaylistId(
        'https://www.youtube.com/playlist?list=PLaZZmCjSdLDGAXN-W0vhh1EOncNte0y2D'
      )
    ).toBe('PLaZZmCjSdLDGAXN-W0vhh1EOncNte0y2D');
    expect(
      extractYoutubePlaylistId(
        'https://www.youtube.com/watch?v=abc&list=PL2j1XMby9UdESuO6eO9BiOVKeXPBZTxih&index=3'
      )
    ).toBe('PL2j1XMby9UdESuO6eO9BiOVKeXPBZTxih');
  });

  it('accepts a raw playlist id', () => {
    expect(extractYoutubePlaylistId('PLpa4S1zG4My1NM9WEu7yF0vZpZfWLdFyZ')).toBe(
      'PLpa4S1zG4My1NM9WEu7yF0vZpZfWLdFyZ'
    );
  });

  it('rejects junk', () => {
    expect(extractYoutubePlaylistId('')).toBeNull();
    expect(extractYoutubePlaylistId('not a playlist')).toBeNull();
  });
});

describe('YouTube title to Spotify search', () => {
  it('keeps the song name and known artist', () => {
    const query = buildSpotifySearchQuery(
      'Putham Pudhu Kaalai - Alaigal Oivathillai | Ilayaraja | 24 Bit Songs| Bharathiraja'
    );
    expect(query.toLowerCase()).toContain('putham pudhu kaalai');
    expect(query.toLowerCase()).toContain('ilayaraja');
  });

  it('strips official video noise', () => {
    const cleaned = cleanYoutubeTitleForSearch(
      'Ennai Thalatta Varuvalo [Official Video] (Lyric Video) HD'
    );
    expect(cleaned.toLowerCase()).not.toContain('official');
    expect(cleaned.toLowerCase()).not.toContain('lyric');
    expect(cleaned.toLowerCase()).toContain('ennai thalatta varuvalo');
  });
});
