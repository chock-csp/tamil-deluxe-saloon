'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

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
  loadPlaylist: (options: { listType: string; list: string; index?: number }) => void;
  cuePlaylist: (options: { listType: string; list: string; index?: number }) => void;
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

  // Update parent state helper
  const updateParent = useCallback(() => {
    if (onStateChange) {
      onStateChange({
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
    onStateChange,
  ]);

  useEffect(() => {
    updateParent();
  }, [updateParent]);

  // Sync state loop
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      timerRef.current = setInterval(() => {
        try {
          if (playerRef.current?.getCurrentTime) {
            setCurrentTime(playerRef.current.getCurrentTime() || 0);
          }
          if (playerRef.current?.getDuration) {
            setDuration(playerRef.current.getDuration() || 0);
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
            setTrackIndex(playerRef.current.getPlaylistIndex() || 0);
          }
          if (playerRef.current?.getPlaylist) {
            const list = playerRef.current.getPlaylist();
            if (list) setTotalTracks(list.length);
          }
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
  }, [isPlaying]);

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

    playerRef.current = new window.YT!.Player(elementId, {
      height: '1',
      width: '1',
      playerVars: {
        listType: 'playlist',
        list: playlistId,
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
        },
        onStateChange: (event: { data: number }) => {
          const state = event.data;
          if (window.YT) {
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setHasUserStarted(true);
              if (playerRef.current?.getVideoData) {
                const data = playerRef.current.getVideoData();
                if (data && data.title) {
                  setTrackTitle(data.title);
                  setArtistName(data.author || 'Tamil Radio Hits');
                  setVideoId(data.video_id || '');
                }
              }
            } else if (
              state === window.YT.PlayerState.PAUSED ||
              state === window.YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
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
  }, [isApiReady, playlistId, volume]);

  // Load new playlist when prop changes
  useEffect(() => {
    if (playerRef.current && playlistId && playerRef.current.loadPlaylist) {
      playerRef.current.loadPlaylist({
        listType: 'playlist',
        list: playlistId,
        index: 0,
      });
    }
  }, [playlistId]);

  // User interactions exposed to window/parent
  const togglePlay = () => {
    if (!playerRef.current) return;
    setHasUserStarted(true);
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const nextTrack = () => {
    if (playerRef.current) {
      setHasUserStarted(true);
      playerRef.current.nextVideo();
    }
  };

  const prevTrack = () => {
    if (playerRef.current) {
      setHasUserStarted(true);
      playerRef.current.previousVideo();
    }
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  };

  const setVolume = (level: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(level);
      setVolumeState(level);
      if (level > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

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

  return (
    <div className="fixed -top-9999px -left-9999px pointer-events-none opacity-0 overflow-hidden w-1 h-1">
      <div ref={containerRef} />
    </div>
  );
};

