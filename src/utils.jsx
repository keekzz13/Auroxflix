// src/utils.jsx
import { toast } from 'sonner';
import MobileDetect from 'mobile-detect';
import config from './config.json';
import { supabase } from './supabaseClient';

const { tmdbApiKey, tmdbBaseUrl, tmdbImageBaseUrl } = config;

/* =========================================================================
   AUTH (lazy, no app-wide context needed)
   ========================================================================= */

let _cachedUser = null;
let _checkedOnce = false;

async function getCurrentUser() {
  try {
    if (_checkedOnce && _cachedUser) return _cachedUser;
    const { data } = await supabase.auth.getSession();
    _cachedUser = data?.session?.user ?? null;
    _checkedOnce = true;
    return _cachedUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user) {
  _cachedUser = user ?? null;
  _checkedOnce = true;
}

/* =========================================================================
   LOCAL MIGRATIONS
   ========================================================================= */
export const migrateLocalStorageData = () => {
  try {
    const oldContinueData = localStorage.getItem('quickwatch-continue');
    if (oldContinueData) {
      const currentContinueData = localStorage.getItem('continue');
      if (!currentContinueData) localStorage.setItem('continue', oldContinueData);
      localStorage.removeItem('quickwatch-continue');
    }
    const oldWatchlistData = localStorage.getItem('quickwatch-watchlist');
    if (oldWatchlistData) {
      const currentWatchlistData = localStorage.getItem('watchlist');
      if (!currentWatchlistData) localStorage.setItem('watchlist', oldWatchlistData);
      localStorage.removeItem('quickwatch-watchlist');
    }
  } catch (e) {
    console.error('local migration failed', e);
  }
};
migrateLocalStorageData();

/* =========================================================================
   TMDB HELPERS
   ========================================================================= */
export const fetchTmdb = async (route) => {
  const url = `${tmdbBaseUrl}${route}`;
  const res = await fetch(url, {
    headers: { Authorization: tmdbApiKey, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
};

export const getTmdbImage = (path, size = 'original') =>
  path ? `${tmdbImageBaseUrl}${size}${path}` : null;

export const formatRuntime = (minutes) => {
  if (!minutes && minutes !== 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatReleaseDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.getFullYear();
};

export const getContentRating = (item) => {
  if (item.content_ratings?.results) {
    const us = item.content_ratings.results.find((r) => r.iso_3166_1 === 'US');
    return us?.rating || 'NR';
  }
  if (item.release_dates?.results) {
    const us = item.release_dates.results.find((r) => r.iso_3166_1 === 'US');
    const pick = us?.release_dates?.find((r) => r.certification?.trim());
    return pick?.certification || 'NR';
  }
  return 'NR';
};

/* =========================================================================
   SMALL LOCAL JSON HELPERS
   ========================================================================= */
function readLocalJson(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocalJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/* =========================================================================
   WATCHLIST (Supabase + anonymous fallback)
   ========================================================================= */
export const getWatchlist = async () => {
  const user = await getCurrentUser();
  if (!user) return readLocalJson('watchlist', []);
  const { data, error } = await supabase
    .from('watchlist_items')
    .select('item_id, media_type, title, poster_path, backdrop_path')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('supabase watchlist error', error);
    return readLocalJson('watchlist', []);
  }
  return (data ?? []).map((d) => ({
    id: d.item_id,
    mediaType: d.media_type,
    title: d.title,
    posterPath: d.poster_path,
    backdropPath: d.backdrop_path,
  }));
};

export const isInWatchlist = async (itemId) => {
  const idStr = String(itemId ?? '');
  const user = await getCurrentUser();
  if (!user) {
    const wl = readLocalJson('watchlist', []);
    return wl.some((i) => i.id === idStr);
  }
  const { data, error } = await supabase
    .from('watchlist_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', idStr)
    .limit(1);
  if (error) {
    console.error('supabase check watchlist error', error);
    const wl = readLocalJson('watchlist', []);
    return wl.some((i) => i.id === idStr);
  }
  return (data?.length ?? 0) > 0;
};

export const addToWatchlist = async (item) => {
  try {
    const user = await getCurrentUser();
    const idStr = String(item?.id ?? '');
    const mediaType =
      item?.media_type || item?.mediaType || (item?.first_air_date ? 'tv' : 'movie');
    const title =
      item?.title || item?.name || item?.original_title || item?.original_name || 'Unknown';
    const posterPath = item?.poster_path ?? item?.posterPath ?? null;
    const backdropPath = item?.backdrop_path ?? item?.backdropPath ?? null;

    if (!user) {
      const wl = readLocalJson('watchlist', []);
      if (!wl.some((w) => w.id === idStr)) {
        wl.push({ id: idStr, mediaType, title, posterPath, backdropPath });
        writeLocalJson('watchlist', wl);
        toast(`Added "${title}" to watchlist`);
      }
      return true;
    }

    const { error, status } = await supabase
      .from('watchlist_items')
      .upsert(
        {
          user_id: user.id,
          item_id: idStr,
          media_type: mediaType,
          title,
          poster_path: posterPath,
          backdrop_path: backdropPath,
        },
        { onConflict: 'user_id,item_id,media_type' }
      );

    if (error) throw error;
    if (status === 201 || status === 200 || status === 204) toast(`Added "${title}" to watchlist`);
    return true;
  } catch (e) {
    console.error('add watchlist error', e);
    toast('Failed to add to watchlist');
    return false;
  }
};

export const removeFromWatchlist = async (itemId) => {
  try {
    const user = await getCurrentUser();
    const idStr = String(itemId ?? '');

    if (!user) {
      const wl = readLocalJson('watchlist', []);
      const target = wl.find((i) => i.id === idStr);
      const updated = wl.filter((i) => i.id !== idStr);
      writeLocalJson('watchlist', updated);
      if (target) toast(`Removed "${target.title}" from watchlist`);
      return true;
    }

    const { data, error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', idStr);

    if (error) throw error;
    const removedTitle = Array.isArray(data) && data[0]?.title ? data[0].title : 'item';
    toast(`Removed "${removedTitle}" from watchlist`);
    return true;
  } catch (e) {
    console.error('remove watchlist error', e);
    toast('Failed to remove from watchlist');
    return false;
  }
};

export const toggleWatchlist = async (item) => {
  const idStr = String(item?.id ?? '');
  if (await isInWatchlist(idStr)) {
    await removeFromWatchlist(idStr);
    return false;
  } else {
    await addToWatchlist(item);
    return true;
  }
};

/* =========================================================================
   CONTINUE WATCHING (Supabase + anonymous fallback)
   ========================================================================= */
export const calculateProgressPercent = (watchedDuration, fullDuration) => {
  if (!fullDuration) return 0;
  return Math.round((watchedDuration / fullDuration) * 100);
};

export const getRemainingTime = (watchedDuration, fullDuration) => {
  if (!fullDuration || watchedDuration == null) return 0;
  const remainingSeconds = Math.max(0, fullDuration - watchedDuration);
  const remainingMinutes = Math.round(remainingSeconds / 60);
  if (remainingMinutes >= 60) {
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    return `${hours}h${mins}m`;
  }
  return `${remainingMinutes}m`;
};

export const formatEpisodeLabel = (season = 0, episode = 0) =>
  `S${Number(season)} · E${Number(episode)}`;

export const timeRemainingLabel = (watchedDuration = 0, fullDuration = 0) => {
  const rem = getRemainingTime(watchedDuration, fullDuration);
  return rem === 0 ? 'Done' : `${rem} left`;
};

// prune other episodes in same season
export const pruneSeasonProgress = async ({
  id,
  mediaType,
  season = 0,
  episode = 0,
  sourceIndex = 0,
}) => {
  const user = await getCurrentUser();
  const itemId = id == null ? '' : String(id);

  if (!user) {
    const list = readLocalJson('continue', []);
    const sameSeason = (e) =>
      String(e.id ?? '') === itemId && e.mediaType === mediaType && (e.season ?? 0) === season;
    const keepExact = (e) =>
      String(e.id ?? '') === itemId &&
      e.mediaType === mediaType &&
      (e.season ?? 0) === season &&
      (e.episode ?? 0) === episode &&
      (e.sourceIndex ?? 0) === sourceIndex;
    const filtered = list.filter((e) => !sameSeason(e) || keepExact(e));
    writeLocalJson('continue', filtered);
    return true;
  }

  const { error } = await supabase
    .from('playback_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .eq('media_type', mediaType)
    .eq('season', season)
    .not('episode', 'eq', episode);
  if (error) {
    console.error('prune season progress error', error);
    return false;
  }
  return true;
};

export const saveProgress = async ({
  id,
  mediaType,
  season = 0,
  episode = 0,
  sourceIndex = 0,
  fullDuration = 0,
  watchedDuration = 0,
  timestamp = Date.now(),
}) => {
  try {
    const user = await getCurrentUser();
    const itemId = id == null ? '' : String(id);

    if (!user) {
      const list = readLocalJson('continue', []);
      const idx = list.findIndex(
        (e) =>
          String(e.id ?? '') === itemId &&
          e.mediaType === mediaType &&
          (e.season ?? 0) === season &&
          (e.episode ?? 0) === episode &&
          (e.sourceIndex ?? 0) === sourceIndex
      );
      const entry = {
        id: itemId ? Number(itemId) : null,
        mediaType,
        season,
        episode,
        sourceIndex,
        fullDuration,
        watchedDuration,
        timestamp,
      };
      if (idx >= 0) list[idx] = entry;
      else list.push(entry);
      writeLocalJson('continue', list);
      await pruneSeasonProgress({ id, mediaType, season, episode, sourceIndex });
      return true;
    }

    const { error } = await supabase
      .from('playback_progress')
      .upsert(
        {
          user_id: user.id,
          item_id: itemId,
          media_type: mediaType,
          season,
          episode,
          source_index: sourceIndex,
          full_duration: fullDuration,
          watched_duration: watchedDuration,
          last_watched_ms: Number(timestamp) || Date.now(),
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,item_id,media_type,season,episode,source_index' }
      );
    if (error) throw error;
    await pruneSeasonProgress({ id, mediaType, season, episode, sourceIndex });
    return true;
  } catch (e) {
    console.error('save progress error', e);
    return false;
  }
};

export const getProgressList = async () => {
  const user = await getCurrentUser();
  if (!user) {
    const list = readLocalJson('continue', []);
    return list.slice().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }
  const { data, error } = await supabase
    .from('playback_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('last_watched_at', { ascending: false });
  if (error) {
    console.error('supabase progress list error', error);
    const list = readLocalJson('continue', []);
    return list.slice().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }
  return (data ?? []).map((d) => ({
    id: d.item_id ? Number(d.item_id) : null,
    mediaType: d.media_type,
    season: d.season ?? 0,
    episode: d.episode ?? 0,
    sourceIndex: d.source_index ?? 0,
    fullDuration: d.full_duration ?? 0,
    watchedDuration: d.watched_duration ?? 0,
    timestamp: d.last_watched_ms ?? new Date(d.last_watched_at).getTime(),
  }));
};

export const getRecentProgress = async (limit = 24) => {
  const list = await getProgressList();
  return Array.isArray(list) ? list.slice(0, limit) : [];
};

export const getProgressForItem = async ({
  id,
  mediaType,
  season = 0,
  episode = 0,
  sourceIndex = 0,
}) => {
  const user = await getCurrentUser();
  const itemId = id == null ? '' : String(id);

  if (!user) {
    const list = readLocalJson('continue', []);
    return (
      list.find(
        (e) =>
          String(e.id ?? '') === itemId &&
          e.mediaType === mediaType &&
          (e.season ?? 0) === season &&
          (e.episode ?? 0) === episode &&
          (e.sourceIndex ?? 0) === sourceIndex
      ) || null
    );
  }

  const { data, error } = await supabase
    .from('playback_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .eq('media_type', mediaType)
    .eq('season', season)
    .eq('episode', episode)
    .eq('source_index', sourceIndex)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('supabase progress item error', error);
    return null;
  }

  if (!data) return null;
  return {
    id: data.item_id ? Number(data.item_id) : null,
    mediaType: data.media_type,
    season: data.season ?? 0,
    episode: data.episode ?? 0,
    sourceIndex: data.source_index ?? 0,
    fullDuration: data.full_duration ?? 0,
    watchedDuration: data.watched_duration ?? 0,
    timestamp: data.last_watched_ms ?? new Date(data.last_watched_at).getTime(),
  };
};

/* =========================================================================
   One-stop helper for Home: build fully decorated CW cards
   ========================================================================= */

const buildWatchPath = (mediaType, id, season, episode) =>
  `/${mediaType}/${id}?watch=1&season=${Math.max(1, season)}&episode=${Math.max(1, episode)}`;

const decorateCwCard = (detail, base) => {
  const isMovie = base.mediaType === 'movie';
  const season = isMovie ? 1 : Math.max(1, base.season || 1);
  const episode = isMovie ? 1 : Math.max(1, base.episode || 1);

  const remainLabel = getRemainingTime(base.watchedDuration, base.fullDuration);
  const remainNum =
    typeof remainLabel === 'string' && remainLabel.endsWith('m')
      ? parseInt(remainLabel.replace('m', ''), 10) || 0
      : 0;

  const percent = calculateProgressPercent(base.watchedDuration, base.fullDuration);
  const path = buildWatchPath(base.mediaType, base.id, season, episode);
  const label = isMovie ? `Movie • ${remainLabel} left` : `S${season} • E${episode} • ${remainLabel} left`;

  return {
    ...detail,
    // ensure both naming variants exist
    mediaType: base.mediaType,
    media_type: base.mediaType,

    // continue-watching helpers
    season_number: season,
    episode_number: episode,
    cw_progress_percent: percent,
    cw_remaining_minutes: remainNum,
    cw_remaining_label: `${remainLabel} left`,
    cw_label: label,
    cw_watch_path: path,

    // many common link keys for compatibility with different cards
    href: path,
    to: path,
    url: path,
    path,
    link: path,
    watchPath: path,

    // useful in some UIs
    override_title: !isMovie && detail?.name ? `${detail.name} — S${season} • E${episode}` : undefined,

    __progress: {
      fullDuration: base.fullDuration,
      watchedDuration: base.watchedDuration,
      timestamp: base.timestamp,
      season: base.season,
      episode: base.episode,
    },
  };
};

// public: returns fully decorated items for the CW row
export const getContinueWatchingCards = async (limit = 24) => {
  // 1) get recent progress (DB or anon fallback)
  const raw = (await getRecentProgress(limit * 2)) || [];

  // 2) dedupe newest per (id, mediaType)
  const latestByKey = new Map();
  for (const r of raw) {
    const id = String(r.id ?? r.item_id ?? '');
    const mediaType = (r.mediaType ?? r.media_type ?? 'movie').toLowerCase();
    if (!id) continue;

    const season = Number(r.season ?? r.season_number ?? (mediaType === 'movie' ? 1 : 1));
    const episode = Number(r.episode ?? r.episode_number ?? (mediaType === 'movie' ? 1 : 1));
    const fullDuration = Number(r.fullDuration ?? r.full_duration ?? 0);
    const watchedDuration = Number(r.watchedDuration ?? r.watched_duration ?? 0);
    const timestamp = Number(r.timestamp ?? r.last_watched_ms ?? Date.now());

    const key = `${id}-${mediaType}`;
    const cand = { id, mediaType, season, episode, fullDuration, watchedDuration, timestamp };
    const prev = latestByKey.get(key);
    if (!prev || cand.timestamp > prev.timestamp) latestByKey.set(key, cand);
  }

  const list = Array.from(latestByKey.values()).slice(0, limit);

  // 3) fetch TMDB details + decorate
  const detailed = await Promise.all(
    list.map(async (it) => {
      try {
        const route = `/${it.mediaType}/${it.id}?language=en-US&append_to_response=images,content_ratings${
          it.mediaType === 'movie' ? ',release_dates' : ''
        }&include_image_language=en`;
        const d = await fetchTmdb(route);
        return decorateCwCard(d, it);
      } catch (e) {
        console.warn('CW detail fetch failed, using minimal', e);
        return decorateCwCard(
          {
            id: Number(it.id),
            title: undefined,
            name: undefined,
            poster_path: null,
            backdrop_path: null,
          },
          it
        );
      }
    })
  );

  return detailed;
};

/* =========================================================================
   LOGIN MIGRATION
   ========================================================================= */
export const migrateLocalToSupabaseOnLogin = async () => {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    const localWatchlist = readLocalJson('watchlist', []);
    if (localWatchlist.length) {
      const rows = localWatchlist.map((w) => ({
        user_id: user.id,
        item_id: String(w.id ?? ''),
        media_type: w.mediaType ?? (w.first_air_date ? 'tv' : 'movie'),
        title: w.title ?? 'Unknown',
        poster_path: w.posterPath ?? null,
        backdrop_path: w.backdropPath ?? null,
      }));
      const { error } = await supabase
        .from('watchlist_items')
        .upsert(rows, { onConflict: 'user_id,item_id,media_type' });
      if (!error) localStorage.removeItem('watchlist');
    }
  } catch (e) {
    console.error('Watchlist migration failed:', e);
  }

  try {
    const localContinue = readLocalJson('continue', []);
    if (localContinue.length) {
      const rows = localContinue.map((e) => ({
        user_id: user.id,
        item_id: e.id == null ? '' : String(e.id),
        media_type: e.mediaType ?? 'movie',
        season: e.season ?? 0,
        episode: e.episode ?? 0,
        source_index: e.sourceIndex ?? 0,
        full_duration: e.fullDuration ?? 0,
        watched_duration: e.watchedDuration ?? 0,
        last_watched_ms: Number(e.timestamp) || Date.now(),
        last_watched_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('playback_progress')
        .upsert(rows, { onConflict: 'user_id,item_id,media_type,season,episode,source_index' });
      if (!error) localStorage.removeItem('continue');
    }
  } catch (e) {
    console.error('Progress migration failed:', e);
  }
};

/* =========================================================================
   IMAGE / DEVICE HELPERS
   ========================================================================= */
export const getImagePath = (detailedItem, item) => {
  if (detailedItem.images?.backdrops) {
    const english = detailedItem.images.backdrops.find(
      (b) => b.iso_639_1 === 'en' || b.iso_639_1 === null
    );
    if (english) return english.file_path;
  }
  if (detailedItem.backdrop_path || item.backdrop_path) {
    return detailedItem.backdrop_path || item.backdrop_path;
  }
  return detailedItem.poster_path || item.poster_path;
};

export const hasEnglishBackdrop = (detailedItem) => {
  if (detailedItem.images?.backdrops) {
    return detailedItem.images.backdrops.some(
      (b) => b.iso_639_1 === 'en' || b.iso_639_1 === null
    );
  }
  return true;
};

export const getLogoPath = (detailedItem) => {
  if (detailedItem.images?.logos) {
    const english = detailedItem.images.logos.find(
      (l) => l.iso_639_1 === 'en' || l.iso_639_1 === null
    );
    if (english) return english.file_path;
    if (detailedItem.images.logos.length > 0) return detailedItem.images.logos[0].file_path;
  }
  return null;
};

export const isMobileDevice = () => {
  const md = new MobileDetect(window.navigator.userAgent);
  return md.mobile() !== null || md.phone() !== null;
};

export const isPhone = () => {
  const md = new MobileDetect(window.navigator.userAgent);
  return md.phone() !== null;
};
