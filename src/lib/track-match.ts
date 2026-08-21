const PLAYLIST_ID_RE = /^[A-Za-z0-9_-]{10,80}$/;

export function extractYoutubePlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  if (trimmed.includes('list=')) {
    try {
      const url = new URL(trimmed);
      const id = url.searchParams.get('list');
      if (id && PLAYLIST_ID_RE.test(id)) return id;
    } catch {
      const fromQuery = trimmed.split('list=')[1]?.split('&')[0]?.split('#')[0];
      if (fromQuery && PLAYLIST_ID_RE.test(fromQuery)) return fromQuery;
    }
  }

  if (PLAYLIST_ID_RE.test(trimmed)) return trimmed;
  return null;
}

const TITLE_NOISE = [
  /\bofficial\s*(music\s*)?video\b/gi,
  /\blyric\s*videos?\b/gi,
  /\bwith\s*lyrics\b/gi,
  /\bfull\s*(hd\s*)?(video|song)\b/gi,
  /\bvideo\s*songs?\b/gi,
  /\baudio\s*songs?\b/gi,
  /\b24\s*bit\s*songs?\b/gi,
  /\bhigh\s*quality\b/gi,
  /\b(4k|8k|hd|hq|1080p|720p)\b/gi,
  /\blyrics?\b/gi,
  /\bvisuali[sz]er\b/gi,
  /\bpromo\b/gi,
  /\[.*?\]/g,
  /\((?:official|video|audio|lyric|hd|4k).*?\)/gi,
];

const KNOWN_ARTISTS = [
  'ilayaraja',
  'ilaiyaraaja',
  'a.r. rahman',
  'ar rahman',
  'a r rahman',
  'harris jayaraj',
  'yuvan shankar raja',
  'deva',
  's. p. balasubrahmanyam',
  'spb',
  's.p. balasubrahmanyam',
  'k. s. chithra',
  'karthik',
  'hariharan',
  'unnikrishnan',
  'shankar mahadevan',
  'sid sriram',
  'anirudh',
  'g. v. prakash',
  'gv prakash',
];

export function cleanYoutubeTitleForSearch(title: string): string {
  if (!title) return '';
  let cleaned = title;
  for (const noise of TITLE_NOISE) {
    cleaned = cleaned.replace(noise, ' ');
  }
  cleaned = cleaned
    .replace(/[|•·]/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, 180);
}

export function buildSpotifySearchQuery(title: string): string {
  if (!title) return '';

  const parts = title
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  const primary = (parts[0] || title).split(' - ')[0].trim();
  const rest = parts.slice(1).join(' ').toLowerCase();
  const artist = KNOWN_ARTISTS.find((name) => rest.includes(name));

  const cleanedPrimary = cleanYoutubeTitleForSearch(primary);
  if (!cleanedPrimary) return cleanYoutubeTitleForSearch(title);

  if (artist) {
    return `track:${cleanedPrimary} artist:${artist}`;
  }
  return cleanedPrimary;
}

export function uniqueVideoIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
