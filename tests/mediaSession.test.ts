import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isMediaSessionSupported,
  updateMediaSessionMetadata,
  setMediaSessionPlaybackState,
  setMediaSessionPositionState,
  bindMediaSessionHandlers,
} from '@/lib/mediaSession';

describe('Media Session helpers', () => {
  const setActionHandler = vi.fn();
  const setPositionState = vi.fn();

  beforeEach(() => {
    setActionHandler.mockReset();
    setPositionState.mockReset();

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: {
        mediaSession: {
          metadata: null,
          playbackState: 'none',
          setActionHandler,
          setPositionState,
        },
      },
    });

    (global as any).MediaMetadata = class MediaMetadata {
      title: string;
      artist: string;
      album: string;
      artwork: MediaImage[];
      constructor(init: MediaMetadataInit) {
        this.title = init.title || '';
        this.artist = init.artist || '';
        this.album = init.album || '';
        this.artwork = (init.artwork as MediaImage[]) || [];
      }
    };
  });

  it('detects Media Session support', () => {
    expect(isMediaSessionSupported()).toBe(true);
  });

  it('updates metadata with artwork sizes for lock-screen notifications', () => {
    updateMediaSessionMetadata({
      title: 'Anbe Sivam',
      artist: 'Kamal',
      artworkUrl: 'https://img.youtube.com/vi/abc/hqdefault.jpg',
    });

    const meta = navigator.mediaSession.metadata as MediaMetadata;
    expect(meta.title).toBe('Anbe Sivam');
    expect(meta.artist).toBe('Kamal');
    expect(meta.artwork?.length).toBe(3);
    expect(meta.artwork?.[0].src).toContain('hqdefault.jpg');
  });

  it('sets playback state used by lock-screen controls', () => {
    setMediaSessionPlaybackState('playing');
    expect(navigator.mediaSession.playbackState).toBe('playing');
    setMediaSessionPlaybackState('paused');
    expect(navigator.mediaSession.playbackState).toBe('paused');
  });

  it('sets position state when duration is valid', () => {
    setMediaSessionPositionState({ duration: 200, position: 42 });
    expect(setPositionState).toHaveBeenCalledWith({
      duration: 200,
      playbackRate: 1,
      position: 42,
    });
  });

  it('binds play/pause/next/prev handlers for lock-screen buttons', () => {
    const play = vi.fn();
    const pause = vi.fn();
    const next = vi.fn();
    const prev = vi.fn();

    const unbind = bindMediaSessionHandlers({
      play,
      pause,
      nexttrack: next,
      previoustrack: prev,
    });

    expect(setActionHandler).toHaveBeenCalledWith('play', expect.any(Function));
    expect(setActionHandler).toHaveBeenCalledWith('pause', expect.any(Function));
    expect(setActionHandler).toHaveBeenCalledWith('nexttrack', expect.any(Function));
    expect(setActionHandler).toHaveBeenCalledWith('previoustrack', expect.any(Function));

    const playHandler = setActionHandler.mock.calls.find((c) => c[0] === 'play')?.[1];
    playHandler?.({});
    expect(play).toHaveBeenCalled();

    unbind();
    expect(setActionHandler).toHaveBeenCalledWith('play', null);
  });
});
