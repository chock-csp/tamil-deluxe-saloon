export interface SavedPlaybackState {
  playlistId: string;
  trackIndex: number;
  currentTime: number;
  isPlaying: boolean;
  timestamp: number;
}

export const PLAYBACK_STORAGE_KEY = 'saloon_radio_playback_state';

export function getCleanPlaylistId(input: string): string {
  if (!input) return '';
  let id = input.trim();
  if (id.includes('list=')) {
    id = id.split('list=')[1].split('&')[0];
  }
  return id;
}

export function savePlaybackState(
  playlistId: string,
  trackIndex: number,
  currentTime: number,
  isPlaying: boolean
): SavedPlaybackState | null {
  if (typeof window === 'undefined' || !playlistId) return null;
  try {
    const cleanId = getCleanPlaylistId(playlistId);
    const state: SavedPlaybackState = {
      playlistId: cleanId,
      trackIndex: Math.max(0, Math.floor(trackIndex || 0)),
      currentTime: Math.max(0, Number(currentTime) || 0),
      isPlaying: Boolean(isPlaying),
      timestamp: Date.now(),
    };
    window.localStorage.setItem(PLAYBACK_STORAGE_KEY, JSON.stringify(state));
    return state;
  } catch (e) {
    return null;
  }
}

export function loadPlaybackState(currentPlaylistId: string): SavedPlaybackState | null {
  if (typeof window === 'undefined' || !currentPlaylistId) return null;
  try {
    const raw = window.localStorage.getItem(PLAYBACK_STORAGE_KEY);
    if (!raw) return null;
    const parsed: SavedPlaybackState = JSON.parse(raw);
    const cleanCurrent = getCleanPlaylistId(currentPlaylistId);
    const cleanSaved = getCleanPlaylistId(parsed.playlistId || '');

    if (cleanSaved === cleanCurrent && typeof parsed.trackIndex === 'number') {
      return {
        playlistId: cleanCurrent,
        trackIndex: Math.max(0, Math.floor(parsed.trackIndex)),
        currentTime: Math.max(0, Number(parsed.currentTime) || 0),
        isPlaying: Boolean(parsed.isPlaying),
        timestamp: parsed.timestamp || Date.now(),
      };
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return null;
}
