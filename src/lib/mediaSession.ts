/**
 * Media Session helpers for lock-screen / notification controls.
 * Improves mobile background playback UX when the OS keeps the media session alive.
 */

export type MediaSessionHandlers = {
  play?: () => void;
  pause?: () => void;
  previoustrack?: () => void;
  nexttrack?: () => void;
  seekto?: (seconds: number) => void;
  seekbackward?: () => void;
  seekforward?: () => void;
};

export function isMediaSessionSupported(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function updateMediaSessionMetadata(opts: {
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
}): void {
  if (!isMediaSessionSupported()) return;

  const artwork: MediaImage[] = [];
  if (opts.artworkUrl) {
    artwork.push(
      { src: opts.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
      { src: opts.artworkUrl, sizes: '256x256', type: 'image/jpeg' },
      { src: opts.artworkUrl, sizes: '512x512', type: 'image/jpeg' }
    );
  }

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: opts.title || 'Tamil Deluxe Saloon',
      artist: opts.artist || 'Tamil Radio',
      album: opts.album || 'Tamil Deluxe Saloon Radio',
      artwork,
    });
  } catch {
    // MediaMetadata may throw in older browsers
  }
}

export function setMediaSessionPlaybackState(
  state: 'none' | 'paused' | 'playing'
): void {
  if (!isMediaSessionSupported()) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    // ignore
  }
}

export function setMediaSessionPositionState(opts: {
  duration: number;
  position: number;
  playbackRate?: number;
}): void {
  if (!isMediaSessionSupported()) return;
  if (!('setPositionState' in navigator.mediaSession)) return;

  const duration = Number.isFinite(opts.duration) && opts.duration > 0 ? opts.duration : 0;
  const position = Math.max(0, Math.min(opts.position || 0, duration || opts.position || 0));

  try {
    if (duration > 0) {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: opts.playbackRate ?? 1,
        position,
      });
    }
  } catch {
    // Invalid state (e.g. position > duration during track change)
  }
}

export function bindMediaSessionHandlers(handlers: MediaSessionHandlers): () => void {
  if (!isMediaSessionSupported()) return () => {};

  const actions: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [];

  const register = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
      actions.push([action, null]);
    } catch {
      // Action not supported on this platform
    }
  };

  if (handlers.play) {
    register('play', () => handlers.play?.());
  }
  if (handlers.pause) {
    register('pause', () => handlers.pause?.());
  }
  if (handlers.previoustrack) {
    register('previoustrack', () => handlers.previoustrack?.());
  }
  if (handlers.nexttrack) {
    register('nexttrack', () => handlers.nexttrack?.());
  }
  if (handlers.seekbackward) {
    register('seekbackward', () => handlers.seekbackward?.());
  }
  if (handlers.seekforward) {
    register('seekforward', () => handlers.seekforward?.());
  }
  if (handlers.seekto) {
    register('seekto', (details) => {
      if (typeof details.seekTime === 'number') {
        handlers.seekto?.(details.seekTime);
      }
    });
  }

  return () => {
    for (const [action] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {
        // ignore
      }
    }
  };
}
