'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CopyPlus,
  Link2,
  ListMusic,
  Loader2,
  Music2,
  Unplug,
} from 'lucide-react';

interface PlaylistRow {
  id: string;
  title: string;
}

interface ImportStatus {
  youtube: { configured: boolean; connected: boolean; name: string | null };
  spotify: { configured: boolean; connected: boolean; name: string | null };
}

interface PreviewTrack {
  videoId: string;
  title: string;
}

interface CloneResult {
  youtubePlaylistId: string;
  youtubeUrl: string;
  spotifyPlaylistId: string;
  spotifyUrl: string;
  youtubeAdded: number;
  youtubeSkipped: number;
  spotifyAdded: number;
  unmatched: string[];
}

export function PlaylistOwnershipPanel({
  rows,
  csrfToken,
  onApplyToRow,
}: {
  rows: PlaylistRow[];
  csrfToken: string | null;
  onApplyToRow: (rowId: string, youtubeId: string, spotifyUrl: string) => void;
}) {
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [source, setSource] = useState('');
  const [titleOverride, setTitleOverride] = useState('');
  const [applyRowId, setApplyRowId] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewPlaylistId, setPreviewPlaylistId] = useState('');
  const [tracks, setTracks] = useState<PreviewTrack[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<CloneResult | null>(null);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'x-admin-csrf-token': csrfToken } : {}),
    }),
    [csrfToken]
  );

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/import', { cache: 'no-store' });
      if (res.ok) setStatus(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const params = new URLSearchParams(window.location.search);
    const importError = params.get('importError');
    if (importError) setError(decodeURIComponent(importError));
    if (params.get('import') || importError) {
      window.history.replaceState({}, '', '/admin');
    }
  }, [loadStatus]);

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/import', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const handleDisconnect = async (provider: 'youtube' | 'spotify') => {
    setError('');
    try {
      await post({ action: 'disconnect', provider });
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    }
  };

  const handlePreview = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    setProgress('Reading public YouTube playlist…');
    try {
      const data = await post({ action: 'preview', source });
      setPreviewTitle(data.title || '');
      setPreviewPlaylistId(data.playlistId || '');
      setTracks(data.tracks || []);
      if (!titleOverride) setTitleOverride(data.title || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
      setTracks([]);
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const handleClone = async () => {
    if (!status?.youtube.connected || !status?.spotify.connected) {
      setError('Connect both YouTube and Spotify first.');
      return;
    }
    if (tracks.length === 0) {
      setError('Preview the public playlist first.');
      return;
    }

    setBusy(true);
    setError('');
    setResult(null);

    try {
      const title = (titleOverride || previewTitle || 'Imported playlist').trim();

      setProgress('Creating a public YouTube playlist on your channel…');
      const yt = await post({
        action: 'youtube-create',
        title,
        sourcePlaylistId: previewPlaylistId,
      });

      let youtubeAdded = 0;
      let youtubeSkipped = 0;
      for (let i = 0; i < tracks.length; i += 8) {
        const chunk = tracks.slice(i, i + 8);
        setProgress(`Copying YouTube videos ${Math.min(i + chunk.length, tracks.length)} / ${tracks.length}…`);
        const added = await post({
          action: 'youtube-items',
          playlistId: yt.playlistId,
          videoIds: chunk.map((t) => t.videoId),
        });
        youtubeAdded += added.added?.length || 0;
        youtubeSkipped += added.skipped?.length || 0;
      }

      setProgress('Creating a public Spotify playlist on your profile…');
      const sp = await post({
        action: 'spotify-create',
        title,
      });

      let spotifyAdded = 0;
      const unmatched: string[] = [];
      for (let i = 0; i < tracks.length; i += 6) {
        const chunk = tracks.slice(i, i + 6);
        setProgress(`Matching Spotify tracks ${Math.min(i + chunk.length, tracks.length)} / ${tracks.length}…`);
        const added = await post({
          action: 'spotify-tracks',
          playlistId: sp.playlistId,
          titles: chunk.map((t) => t.title),
        });
        spotifyAdded += added.added || 0;
        for (const match of added.matches || []) {
          if (!match.uri) unmatched.push(match.title || match.query);
        }
      }

      const clone: CloneResult = {
        youtubePlaylistId: yt.playlistId,
        youtubeUrl: yt.url,
        spotifyPlaylistId: sp.playlistId,
        spotifyUrl: sp.url,
        youtubeAdded,
        youtubeSkipped,
        spotifyAdded,
        unmatched,
      };
      setResult(clone);

      if (applyRowId) {
        onApplyToRow(applyRowId, yt.playlistId, sp.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone failed');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-amber-500/25 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-amber-200 flex items-center gap-2">
            <CopyPlus className="w-4 h-4" />
            Take ownership of a public playlist
          </h2>
          <p className="text-xs text-amber-300/70 mt-1">
            Paste any public YouTube playlist. This copies it onto your YouTube channel, then
            builds a public Spotify playlist by searching each song.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AccountCard
          label="YouTube"
          configured={status?.youtube.configured}
          connected={status?.youtube.connected}
          name={status?.youtube.name}
          connectHref="/api/oauth/youtube"
          onDisconnect={() => handleDisconnect('youtube')}
          setupHint="Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Redirect URI: /api/oauth/youtube/callback"
        />
        <AccountCard
          label="Spotify"
          configured={status?.spotify.configured}
          connected={status?.spotify.connected}
          name={status?.spotify.name}
          connectHref="/api/oauth/spotify"
          onDisconnect={() => handleDisconnect('spotify')}
          setupHint="Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET. Redirect URI: /api/oauth/spotify/callback"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-amber-300/80 block">
          Public YouTube playlist URL or ID
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=PLxxxxx"
            className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400 font-mono"
          />
          <button
            type="button"
            onClick={handlePreview}
            disabled={busy || !source.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-bold disabled:opacity-50"
          >
            Preview songs
          </button>
        </div>
      </div>

      {tracks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-amber-300/80 block">
              New playlist title
            </label>
            <input
              type="text"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-amber-300/80 block">
              After clone, fill this admin row
            </label>
            <select
              value={applyRowId}
              onChange={(e) => setApplyRowId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="">Don’t update a row yet</option>
              {rows.map((row, idx) => (
                <option key={row.id} value={row.id}>
                  Row {idx + 1}: {row.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {tracks.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-black/30 p-3 space-y-2">
          <div className="text-xs text-amber-200 font-semibold">
            {previewTitle || 'Playlist'} · {tracks.length} songs
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {tracks.slice(0, 40).map((track) => (
              <div key={track.videoId} className="text-[11px] text-amber-300/80 truncate">
                {track.title || track.videoId}
              </div>
            ))}
            {tracks.length > 40 && (
              <div className="text-[11px] text-amber-400/60">
                + {tracks.length - 40} more
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleClone}
          disabled={
            busy ||
            tracks.length === 0 ||
            !status?.youtube.connected ||
            !status?.spotify.connected
          }
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListMusic className="w-4 h-4" />}
          {busy ? progress || 'Working…' : 'Clone to my YouTube + Spotify'}
        </button>
        {progress && <span className="text-[11px] text-amber-300/70">{progress}</span>}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 space-y-2 text-xs text-emerald-200">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Playlists created on your accounts
          </div>
          <a href={result.youtubeUrl} target="_blank" rel="noreferrer" className="block underline">
            YouTube: {result.youtubeUrl} ({result.youtubeAdded} videos
            {result.youtubeSkipped ? `, ${result.youtubeSkipped} skipped` : ''})
          </a>
          <a href={result.spotifyUrl} target="_blank" rel="noreferrer" className="block underline">
            Spotify: {result.spotifyUrl} ({result.spotifyAdded} matched tracks)
          </a>
          {applyRowId && (
            <div className="text-amber-200">
              Admin row fields were filled. Click Save All Changes to persist them.
            </div>
          )}
          {result.unmatched.length > 0 && (
            <details className="text-amber-200/80">
              <summary>{result.unmatched.length} songs had no Spotify match</summary>
              <div className="mt-1 max-h-32 overflow-y-auto space-y-0.5">
                {result.unmatched.map((title) => (
                  <div key={title}>{title}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function AccountCard({
  label,
  configured,
  connected,
  name,
  connectHref,
  onDisconnect,
  setupHint,
}: {
  label: string;
  configured?: boolean;
  connected?: boolean;
  name: string | null | undefined;
  connectHref: string;
  onDisconnect: () => void;
  setupHint: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-black/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-amber-100 flex items-center gap-1.5">
          {label === 'Spotify' ? <Music2 className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          {label}
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            connected
              ? 'bg-emerald-500/20 text-emerald-300'
              : configured
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          {connected ? `Connected${name ? ` · ${name}` : ''}` : configured ? 'Not connected' : 'Not configured'}
        </span>
      </div>
      {!configured ? (
        <p className="text-[11px] text-amber-300/70">{setupHint}</p>
      ) : connected ? (
        <button
          type="button"
          onClick={onDisconnect}
          className="inline-flex items-center gap-1 text-[11px] text-red-300 hover:text-red-200"
        >
          <Unplug className="w-3 h-3" />
          Disconnect
        </button>
      ) : (
        <a
          href={connectHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-100 text-[11px] font-bold"
        >
          Connect {label}
        </a>
      )}
    </div>
  );
}
