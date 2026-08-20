'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { savePlaybackState, loadPlaybackState, getCleanPlaylistId } from '@/lib/playbackState';
import {
  bindMediaSessionHandlers,
  setMediaSessionPlaybackState,
  setMediaSessionPositionState,
  updateMediaSessionMetadata,
} from '@/lib/mediaSession';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: Record<string, unknown>
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoData: () => { title: string; author: string; video_id: string };
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
  destroy: () => void;
  loadPlaylist: (options: { listType: string; list: string; index?: number; startSeconds?: number }) => void;
  cuePlaylist: (options: { listType: string; list: string; index?: number; startSeconds?: number }) => void;
}

export interface AudioEngineRef {
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  loadPlaylist: (playlistId: string) => void;
}

interface AudioEngineProps {
  playlistId: string;
  onStateChange?: (state: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    trackTitle: string;
    artistName: string;
    videoId: string;
    trackIndex: number;
    totalTracks: number;
    hasUserStarted: boolean;
  }) => void;
  ref?: React.Ref<AudioEngineRef>;
}

export const AudioEngine: React.FC<AudioEngineProps> = ({
  playlistId,
  onStateChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [trackTitle, setTrackTitle] = useState('Tamil Deluxe Saloon Radio');
  const [artistName, setArtistName] = useState('90s & 2000s Kollywood Hits');
  const [videoId, setVideoId] = useState('');
  const [trackIndex, setTrackIndex] = useState(0);
  const [totalTracks, setTotalTracks] = useState(1);
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);

  const trackIndexRef = useRef(trackIndex);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(isPlaying);
  const wantPlayingRef = useRef(false);
  const currentPlaylistIdRef = useRef(playlistId);
  const trackTitleRef = useRef(trackTitle);
  const artistNameRef = useRef(artistName);
  const videoIdRef = useRef(videoId);

  useEffect(() => { trackIndexRef.current = trackIndex; }, [trackIndex]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentPlaylistIdRef.current = playlistId; }, [playlistId]);
  useEffect(() => { trackTitleRef.current = trackTitle; }, [trackTitle]);
  useEffect(() => { artistNameRef.current = artistName; }, [artistName]);
  useEffect(() => { videoIdRef.current = videoId; }, [videoId]);

  const syncMediaSession = useCallback(() => {
    const artworkUrl = videoIdRef.current
      ? `https://img.youtube.com/vi/${videoIdRef.current}/hqdefault.jpg`
      : undefined;
    updateMediaSessionMetadata({
      title: trackTitleRef.current || 'Tamil Deluxe Saloon Radio',
      artist: artistNameRef.current || 'Tamil Radio',
      album: 'Tamil Deluxe Saloon',
      artworkUrl,
    });
    setMediaSessionPlaybackState(wantPlayingRef.current || isPlayingRef.current ? 'playing' : 'paused');
    setMediaSessionPositionState({
      duration: durationRef.current,
      position: currentTimeRef.current,
    });
  }, []);

  const tryResumePlayback = useCallback(() => {
    if (!wantPlayingRef.current || !playerRef.current?.playVideo) return;
    try {
      playerRef.current.playVideo();
    } catch {
      // Browser may block resume without a fresh user gesture
    }
  }, []);

  const persistCurrentState = useCallback(() => {
    if (!currentPlaylistIdRef.current) return;
    let cTime = currentTimeRef.current;
    let tIdx = trackIndexRef.current;
    if (playerRef.current?.getCurrentTime) {
      try {
        const t = playerRef.current.getCurrentTime();
        if (typeof t === 'number' && !isNaN(t) && t >= 0) cTime = t;
      } catch (e) {}
    }
    if (playerRef.current?.getPlaylistIndex) {
      try {
        const idx = playerRef.current.getPlaylistIndex();
        if (typeof idx === 'number' && !isNaN(idx) && idx >= 0) tIdx = idx;
      } catch (e) {}
    }
    savePlaybackState(currentPlaylistIdRef.current, tIdx, cTime, isPlayingRef.current);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistCurrentState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [persistCurrentState]);

  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Update parent state helper safely without infinite dependency loops
  useEffect(() => {
    if (onStateChangeRef.current) {
      onStateChangeRef.current({
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        trackTitle,
        artistName,
        videoId,
        trackIndex,
        totalTracks,
        hasUserStarted,
      });
    }
  }, [
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    trackTitle,
    artistName,
    videoId,
    trackIndex,
    totalTracks,
    hasUserStarted,
  ]);

  // Sync state loop
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      timerRef.current = setInterval(() => {
        try {
          if (playerRef.current?.getCurrentTime) {
            const t = playerRef.current.getCurrentTime() || 0;
            setCurrentTime(t);
            currentTimeRef.current = t;
          }
          if (playerRef.current?.getDuration) {
            const d = playerRef.current.getDuration() || 0;
            setDuration(d);
            durationRef.current = d;
          }
          if (playerRef.current?.getVideoData) {
            const data = playerRef.current.getVideoData();
            if (data && data.title) {
              setTrackTitle(data.title);
              setArtistName(data.author || 'Tamil Radio Hits');
              setVideoId(data.video_id || '');
            }
          }
          if (playerRef.current?.getPlaylistIndex) {
            const idx = playerRef.current.getPlaylistIndex() || 0;
            setTrackIndex(idx);
            trackIndexRef.current = idx;
          }
          if (playerRef.current?.getPlaylist) {
            const list = playerRef.current.getPlaylist();
            if (list) setTotalTracks(list.length);
          }
          persistCurrentState();
          syncMediaSession();
        } catch (e) {
          // Ignore polling errors during track transitions
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, persistCurrentState, syncMediaSession]);

  // Load YouTube Iframe API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);

  // Initialize YT Player once API is ready
  useEffect(() => {
    if (!isApiReady || !containerRef.current || playerRef.current) return;

    const elementId = 'yt-hidden-audio-player';
    const playerContainer = document.createElement('div');
    playerContainer.id = elementId;
    containerRef.current.appendChild(playerContainer);

    const cleanId = getCleanPlaylistId(playlistId);
    const savedState = loadPlaybackState(cleanId);
    const initialIndex = savedState ? savedState.trackIndex : 0;
    const initialTime = savedState ? savedState.currentTime : 0;
    const initialWasPlaying = savedState ? savedState.isPlaying : false;

    if (savedState) {
      setTrackIndex(initialIndex);
      setCurrentTime(initialTime);
      trackIndexRef.current = initialIndex;
      currentTimeRef.current = initialTime;
    }

    playerRef.current = new window.YT!.Player(elementId, {
      // Real iframe dimensions help some mobile browsers keep media eligible
      // for lock-screen / background controls (1x1 + opacity:0 often gets suspended).
      height: '180',
      width: '320',
      playerVars: {
        listType: 'playlist',
        list: cleanId,
        index: initialIndex,
        startSeconds: Math.floor(initialTime),
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: { target: YTPlayer }) => {
          event.target.setVolume(volume);
          if (initialIndex > 0 || initialTime > 0) {
            try {
              if (initialWasPlaying) {
                event.target.loadPlaylist({
                  listType: 'playlist',
                  list: cleanId,
                  index: initialIndex,
                  startSeconds: Math.floor(initialTime),
                });
              } else {
                event.target.cuePlaylist({
                  listType: 'playlist',
                  list: cleanId,
                  index: initialIndex,
                  startSeconds: Math.floor(initialTime),
                });
              }
            } catch (e) {
              if (event.target.seekTo && initialTime > 0) {
                event.target.seekTo(initialTime, true);
              }
            }
          }
          if (initialWasPlaying) {
            wantPlayingRef.current = true;
            try {
              event.target.playVideo();
            } catch (e) {}
          }
          try {
            if (event.target.getVideoData) {
              const data = event.target.getVideoData();
              if (data && data.video_id) {
                setVideoId(data.video_id);
                if (data.title) setTrackTitle(data.title);
              }
            }
            if (event.target.getPlaylist) {
              const list = event.target.getPlaylist();
              if (list && list[0]) {
                setVideoId((prev) => prev || list[0]);
                setTotalTracks(list.length);
              }
            }
          } catch (e) {}
          syncMediaSession();
        },
        onStateChange: (event: { data: number }) => {
          const state = event.data;
          if (window.YT) {
            // Read video metadata on CUED (5), UNSTARTED (-1), or PLAYING (1)
            if (playerRef.current?.getVideoData) {
              try {
                const data = playerRef.current.getVideoData();
                if (data && data.video_id) {
                  setVideoId(data.video_id);
                  if (data.title) setTrackTitle(data.title);
                  if (data.author) setArtistName(data.author);
                }
              } catch (e) {}
            }

            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              isPlayingRef.current = true;
              wantPlayingRef.current = true;
              setHasUserStarted(true);
              persistCurrentState();
              syncMediaSession();
            } else if (
              state === window.YT.PlayerState.PAUSED ||
              state === window.YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
              isPlayingRef.current = false;
              // ENDED means track finished — allow next cue; only clear intent on explicit pause
              // when page is still visible (user paused). If page is hidden, OS/YouTube may
              // pause us — keep wantPlaying so lock-screen Play / resume can restart.
              if (state === window.YT.PlayerState.ENDED) {
                wantPlayingRef.current = true;
              } else if (typeof document !== 'undefined' && !document.hidden) {
                wantPlayingRef.current = false;
              }
              persistCurrentState();
              syncMediaSession();
            }
          }
        },
      },
    });

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [isApiReady, playlistId, volume, persistCurrentState, syncMediaSession]);

  // Load new playlist when prop changes
  useEffect(() => {
    if (playerRef.current && playlistId && playerRef.current.loadPlaylist) {
      const cleanId = getCleanPlaylistId(playlistId);
      const saved = loadPlaybackState(cleanId);
      const targetIdx = saved ? saved.trackIndex : 0;
      const targetTime = saved ? saved.currentTime : 0;

      playerRef.current.loadPlaylist({
        listType: 'playlist',
        list: cleanId,
        index: targetIdx,
        startSeconds: Math.floor(targetTime),
      });
    }
  }, [playlistId]);

  // User interactions exposed to window/parent
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    setHasUserStarted(true);
    if (isPlayingRef.current) {
      wantPlayingRef.current = false;
      playerRef.current.pauseVideo();
    } else {
      wantPlayingRef.current = true;
      playerRef.current.playVideo();
    }
    syncMediaSession();
  }, [syncMediaSession]);

  const play = useCallback(() => {
    if (!playerRef.current) return;
    setHasUserStarted(true);
    wantPlayingRef.current = true;
    playerRef.current.playVideo();
    syncMediaSession();
  }, [syncMediaSession]);

  const pause = useCallback(() => {
    if (!playerRef.current) return;
    wantPlayingRef.current = false;
    playerRef.current.pauseVideo();
    syncMediaSession();
  }, [syncMediaSession]);

  const nextTrack = useCallback(() => {
    if (playerRef.current) {
      setHasUserStarted(true);
      wantPlayingRef.current = true;
      playerRef.current.nextVideo();
    }
  }, []);

  const prevTrack = useCallback(() => {
    if (playerRef.current) {
      setHasUserStarted(true);
      wantPlayingRef.current = true;
      playerRef.current.previousVideo();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
      currentTimeRef.current = seconds;
      syncMediaSession();
    }
  }, [syncMediaSession]);

  const setVolume = useCallback((level: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(level);
      setVolumeState(level);
      if (level > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  // Lock-screen / notification media controls (Media Session API)
  useEffect(() => {
    const unbind = bindMediaSessionHandlers({
      play: () => {
        wantPlayingRef.current = true;
        play();
      },
      pause: () => {
        wantPlayingRef.current = false;
        pause();
      },
      previoustrack: () => prevTrack(),
      nexttrack: () => nextTrack(),
      seekto: (seconds) => seekTo(seconds),
      seekbackward: () => {
        seekTo(Math.max(0, currentTimeRef.current - 10));
      },
      seekforward: () => {
        const max = durationRef.current || currentTimeRef.current + 10;
        seekTo(Math.min(max, currentTimeRef.current + 10));
      },
    });
    syncMediaSession();
    return unbind;
  }, [play, pause, prevTrack, nextTrack, seekTo, syncMediaSession]);

  // Keep / resume playback when the tab is backgrounded or the phone is locked.
  // Mobile browsers and YouTube often pause embeds on lock. We:
  // 1) keep Media Session "playing" so lock-screen Play stays available when the OS allows it
  // 2) attempt a few short resumes after backgrounding (helps some Android browsers)
  // 3) always resume when the page becomes visible again if the user still wants playback
  // Continuous forced play while locked is intentionally avoided (YouTube/OS policy + battery).
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (wantPlayingRef.current || isPlayingRef.current) {
          wantPlayingRef.current = true;
          syncMediaSession();
          // A few spaced resume attempts right after lock/background
          tryResumePlayback();
          window.setTimeout(() => {
            if (wantPlayingRef.current && document.hidden) tryResumePlayback();
          }, 400);
          window.setTimeout(() => {
            if (wantPlayingRef.current && document.hidden) tryResumePlayback();
          }, 1200);
          window.setTimeout(() => {
            if (wantPlayingRef.current && document.hidden) tryResumePlayback();
          }, 3000);
        }
      } else {
        if (wantPlayingRef.current) {
          tryResumePlayback();
          syncMediaSession();
        }
      }
    };

    const handlePageShow = () => {
      if (wantPlayingRef.current) tryResumePlayback();
    };

    const handleFreeze = () => {
      persistCurrentState();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('freeze', handleFreeze as EventListener);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('freeze', handleFreeze as EventListener);
    };
  }, [tryResumePlayback, syncMediaSession, persistCurrentState]);

  // Listen to window custom events from PlayerPill
  useEffect(() => {
    const handleTogglePlay = () => togglePlay();
    const handleNext = () => nextTrack();
    const handlePrev = () => prevTrack();
    const handleSeek = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'number') seekTo(detail);
    };
    const handleVolume = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'number') setVolume(detail);
    };
    const handleMute = () => toggleMute();

    window.addEventListener('yt-toggle-play', handleTogglePlay);
    window.addEventListener('yt-next', handleNext);
    window.addEventListener('yt-prev', handlePrev);
    window.addEventListener('yt-seek', handleSeek);
    window.addEventListener('yt-volume', handleVolume);
    window.addEventListener('yt-mute', handleMute);

    return () => {
      window.removeEventListener('yt-toggle-play', handleTogglePlay);
      window.removeEventListener('yt-next', handleNext);
      window.removeEventListener('yt-prev', handlePrev);
      window.removeEventListener('yt-seek', handleSeek);
      window.removeEventListener('yt-volume', handleVolume);
      window.removeEventListener('yt-mute', handleMute);
    };
  }, [togglePlay, nextTrack, prevTrack, seekTo, setVolume, toggleMute]);

  // Off-screen but real-sized player: opacity:0 / 1×1 iframes are often suspended
  // by mobile browsers when the screen locks. Keep a full iframe in the DOM tree,
  // clipped off-viewport so audio remains an eligible media session source.
  return (
    <div
      aria-hidden="true"
      className="fixed pointer-events-none overflow-hidden"
      style={{
        width: 320,
        height: 180,
        top: 0,
        left: 0,
        transform: 'translate(-10000px, -10000px)',
        // Do not use opacity:0 or visibility:hidden — those can kill mobile media.
        zIndex: -1,
      }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

