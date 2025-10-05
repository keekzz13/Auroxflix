// src/pages/browse/ContinueWatching.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import { getContinueWatchingCards } from '../../utils.jsx';
import { getTmdbImage } from '../../utils.jsx';
import { ChevronLeft } from 'lucide-react';

const buildCards = (items = []) =>
  items.map((it) => {
    const mt = (it.mediaType || it.media_type || (it.title ? 'movie' : 'tv')).toLowerCase();
    const id = it.id;

    const season =
      mt === 'movie'
        ? 1
        : Math.max(1, it.__progress?.season ?? it.season_number ?? it.season ?? 1);

    const episode =
      mt === 'movie'
        ? 1
        : Math.max(1, it.__progress?.episode ?? it.episode_number ?? it.episode ?? 1);

    const path = `/${mt}/${id}?watch=1&season=${season}&episode=${episode}`;

    const full = Number(it.__progress?.fullDuration ?? it.full_duration ?? it.fullDuration ?? 0);
    const watched = Number(
      it.__progress?.watchedDuration ?? it.watched_duration ?? it.watchedDuration ?? 0
    );
    const pct = full > 0 ? Math.min(100, Math.round((watched / full) * 100)) : 0;

    const remainingLabel = (() => {
      if (!full) return '0 left';
      const rem = Math.max(0, full - watched);
      const minutes = Math.round(rem / 60);
      if (minutes >= 60) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h${m}m left`;
      }
      return `${minutes}m left`;
    })();

    const sub =
      mt === 'movie' ? `Movie • ${remainingLabel}` : `S${season} • E${episode} • ${remainingLabel}`;

    return {
      id,
      mt,
      season,
      episode,
      path,
      pct,
      sub,
      img: getTmdbImage(it.backdrop_path) || getTmdbImage(it.poster_path),
      title: it.title || it.name || 'Untitled',
    };
  });

const ContinueWatching = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rawItems, setRawItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch a generous amount; this page is the full list
        const items = await getContinueWatchingCards(300);
        if (!cancelled) {
          setRawItems(items ?? []);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load Continue Watching list:', e);
        if (!cancelled) {
          setRawItems([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => buildCards(rawItems), [rawItems]);

  return (
    <div className="min-h-screen bg-[#090a0a] text-white">
      <Header />

      <main className="px-2 sm:px-4 md:px-8 py-6 md:py-10 sm:mt-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full bg-white/10 hover:bg-white/20 p-2"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-semibold">Continue Watching</h1>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-white/70">No items to continue right now.</div>
        ) : (
          <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {cards.map((c) => (
              <button
                key={`${c.mt}-${c.id}-${c.season}-${c.episode}`}
                className="relative group rounded-xl overflow-hidden bg-neutral-900 text-left"
                onClick={() => navigate(c.path)}
              >
                <div
                  className="w-full aspect-video bg-cover bg-center"
                  style={{ backgroundImage: `url('${c.img || ''}')` }}
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute left-3 bottom-10">
                  <div className="bg-white/15 backdrop-blur-xs text-white text-xs md:text-sm px-2.5 md:px-3 py-1.5 rounded-full shadow">
                    Continue watching
                  </div>
                </div>
                <div className="absolute left-3 bottom-4 text-[11px] md:text-sm text-white/90">
                  {c.sub}
                </div>
                <div className="absolute left-0 right-0 bottom-0 h-1.5 bg-white/10">
                  <div className="h-full bg-white/90" style={{ width: `${c.pct}%` }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ContinueWatching;
