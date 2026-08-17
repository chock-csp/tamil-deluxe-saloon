import { describe, it, expect, beforeEach } from 'vitest';
import { savePlaybackState, loadPlaybackState, PLAYBACK_STORAGE_KEY } from '@/lib/playbackState';

describe('Playback State Persistence', () => {
  const samplePlaylistId = 'PLxIPumcDtzc3YzI-N28cFfwa5JBdxqH6j';

  beforeEach(() => {
    // Clear localStorage mockup
    const storage: Record<string, string> = {};
    global.window = {
      localStorage: {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, val: string) => {
          storage[key] = val;
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
      },
    } as any;
  });

  it('should save and load the 5th song playback state (index 4) on reload (Test 1)', () => {
    // 5th song playing at 42.5 seconds
    const saved = savePlaybackState(samplePlaylistId, 4, 42.5, true);
    expect(saved).not.toBeNull();
    expect(saved?.trackIndex).toBe(4);
    expect(saved?.currentTime).toBe(42.5);
    expect(saved?.isPlaying).toBe(true);

    const loaded = loadPlaybackState(samplePlaylistId);
    expect(loaded).not.toBeNull();
    expect(loaded?.trackIndex).toBe(4);
    expect(loaded?.currentTime).toBe(42.5);
    expect(loaded?.isPlaying).toBe(true);
  });

  it('should preserve 5th song position across multiple reloads (Test 2)', () => {
    // 5th song playing at 115 seconds
    savePlaybackState(samplePlaylistId, 4, 115.0, true);
    const loadedFirstReload = loadPlaybackState(samplePlaylistId);
    expect(loadedFirstReload?.trackIndex).toBe(4);
    expect(loadedFirstReload?.currentTime).toBe(115.0);

    // Simulate continuing to play 5th song up to 140s then reloading again
    savePlaybackState(samplePlaylistId, 4, 140.0, true);
    const loadedSecondReload = loadPlaybackState(samplePlaylistId);
    expect(loadedSecondReload?.trackIndex).toBe(4);
    expect(loadedSecondReload?.currentTime).toBe(140.0);
  });

  it('should reset track index if loaded with a different playlist ID', () => {
    savePlaybackState(samplePlaylistId, 4, 42.5, true);
    const loadedDifferent = loadPlaybackState('PLdifferentPlaylist123');
    expect(loadedDifferent).toBeNull();
  });
});
