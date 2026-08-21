import { describe, it, expect } from 'vitest';
import { collectPlaylistVideosFromBrowseResponse } from '../src/lib/youtube-playlist';
import { encryptJson, decryptJson } from '../src/lib/oauth-crypto';

describe('YouTube innertube playlist parsing', () => {
  it('collects lockup videos, title, and continuation', () => {
    const data = {
      metadata: { playlistMetadataRenderer: { title: 'Ilayaraja Classics' } },
      contents: {
        lockupViewModel: {
          contentId: 'rElxu7BR0Kc',
          contentType: 'LOCKUP_CONTENT_TYPE_VIDEO',
          metadata: {
            lockupMetadataViewModel: {
              title: { content: 'Putham Pudhu Kaalai | Ilayaraja' },
            },
          },
        },
      },
      extra: {
        continuationEndpoint: {
          continuationCommand: { token: 'CONT123' },
        },
      },
    };

    const parsed = collectPlaylistVideosFromBrowseResponse(data);
    expect(parsed.title).toBe('Ilayaraja Classics');
    expect(parsed.tracks).toEqual([
      { videoId: 'rElxu7BR0Kc', title: 'Putham Pudhu Kaalai | Ilayaraja' },
    ]);
    expect(parsed.continuation).toBe('CONT123');
  });

  it('also reads classic playlistVideoRenderer items', () => {
    const parsed = collectPlaylistVideosFromBrowseResponse({
      playlistVideoRenderer: {
        videoId: 'abc12345678',
        title: { runs: [{ text: 'Song Title' }] },
      },
    });
    expect(parsed.tracks[0]).toEqual({ videoId: 'abc12345678', title: 'Song Title' });
  });
});

describe('oauth cookie crypto', () => {
  it('round-trips JSON payloads', () => {
    const payload = { accessToken: 'tok', expiresAt: 123, provider: 'spotify' };
    expect(decryptJson(encryptJson(payload))).toEqual(payload);
  });

  it('returns null for garbage', () => {
    expect(decryptJson('not-valid')).toBeNull();
  });
});
