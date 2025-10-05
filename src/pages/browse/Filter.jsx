// src/pages/browse/Filter.jsx
import React, { useEffect, useRef, useState } from 'react';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import CarouselItem from '../../components/carouselItem.jsx';
import { SearchSkeleton } from '../../components/Skeletons.jsx';
import { fetchTmdb } from '../../utils.jsx';
import { useFilterStore } from '../../store/filterStore.js';

const DEBOUNCE_MS = 500;

const Filter = () => {
  // ---- Zustand global state & actions ----
  const {
    mediaType, selectedGenre, year, sortBy,
    results, page, totalPages, genresCache,
    setFilters, replaceResults, appendResults, setGenresForType, clearFilters,
  } = useFilterStore();

  // ---- Local-only UI flags ----
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ---- Refs ----
  const sentinelRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Responsive card poster use
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load genres whenever media type changes (use cache first)
  useEffect(() => {
    let ignore = false;
    const cached = genresCache?.[mediaType] || [];
    if (cached.length === 0) {
      (async () => {
        try {
          const data = await fetchTmdb(`/genre/${mediaType}/list?language=en-US`);
          if (!ignore) setGenresForType(mediaType, data.genres || []);
        } catch (e) {
          console.error('Error loading genres', e);
        }
      })();
    }
    // Optional: reset genre when switching type
    setFilters({ selectedGenre: '' });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType]);

  // Build query params for /discover
  const buildParams = (pageNum) => {
    const params = new URLSearchParams({
      sort_by: sortBy,
      with_genres: selectedGenre || '',
      page: String(pageNum),
      language: 'en-US',
    });

    if (mediaType === 'movie') {
      if (year) params.set('primary_release_year', year);
    } else {
      if (year) params.set('first_air_date_year', year);
    }

    return params.toString();
  };

  // Cancel any in-flight request
  const cancelInFlight = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  // Fetch a page
  const fetchPage = async ({ pageNum, append }) => {
    cancelInFlight();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      if (append) setIsFetchingMore(true);
      else setIsInitialLoading(true);

      const query = buildParams(pageNum);
      const data = await fetchTmdb(`/discover/${mediaType}?${query}`, { signal: ac.signal });

      // Filter to useful results
      const filtered = (data.results || []).filter(
        (item) => (item.backdrop_path || item.poster_path) && item.vote_average > 0 && item.vote_count >= 3
      );

      if (append) {
        appendResults({ results: filtered, page: pageNum, totalPages: data.total_pages || 1 });
      } else {
        replaceResults({ results: filtered, page: pageNum, totalPages: data.total_pages || 1 });
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Fetch error', e);
    } finally {
      if (append) setIsFetchingMore(false);
      else setIsInitialLoading(false);
      abortRef.current = null;
    }
  };

  // Debounced (re)load when filters change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      replaceResults({ results: [], page: 1, totalPages: 1 });
      fetchPage({ pageNum: 1, append: false });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(debounceRef.current);
      cancelInFlight();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, selectedGenre, year, sortBy]);

  // On mount: if we already have cached results, skip initial fetch
  useEffect(() => {
    if (results && results.length > 0) return; // cached
    fetchPage({ pageNum: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver for endless scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const hasMore = page < totalPages;
        if (entry.isIntersecting && hasMore && !isInitialLoading && !isFetchingMore) {
          fetchPage({ pageNum: page + 1, append: true });
        }
      },
      { root: null, rootMargin: '1000px 0px 1000px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, totalPages, isInitialLoading, isFetchingMore, mediaType, selectedGenre, year, sortBy]);

  const genres = genresCache?.[mediaType] || [];

  return (
    <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0">
      <Header />

      <div className="pt-8 md:pt-24 px-8 pb-8">
        <h1 className="text-4xl font-bold text-white mb-6">
          Filter {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
        </h1>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {/* Media Type */}
          <select
            value={mediaType}
            onChange={(e) => setFilters({ mediaType: e.target.value })}
            className="bg-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>

          {/* Genre */}
          <select
            value={selectedGenre}
            onChange={(e) => setFilters({ selectedGenre: e.target.value })}
            className="bg-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          {/* Year */}
          <input
            type="number"
            placeholder="Year"
            value={year}
            onChange={(e) => setFilters({ year: e.target.value })}
            className="bg-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20"
          />

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setFilters({ sortBy: e.target.value })}
            className="bg-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <option value="popularity.desc">Popularity High to Low</option>
            <option value="popularity.asc">Popularity Low to High</option>
            <option value="vote_average.desc">Rating High to Low</option>
            <option value="vote_average.asc">Rating Low to High</option>
            <option value="release_date.desc">Release Date Newest</option>
            <option value="release_date.asc">Release Date Oldest</option>
          </select>

          {/* Clear filters */}
          <button
            type="button"
            onClick={() => clearFilters()}
            className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/15 transition"
          >
            Clear Filters
          </button>
        </div>

        {/* Results */}
        {isInitialLoading && results.length === 0 ? (
          <SearchSkeleton />
        ) : results.length === 0 ? (
          <div className="text-white text-xl">No results found</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((item) => (
                <CarouselItem key={`${mediaType}-${item.id}`} item={item} usePoster={isMobile} />
              ))}
            </div>

            {/* Sentinel for endless scroll */}
            <div ref={sentinelRef} className="h-10 w-full" />

            {/* Loading more spinner */}
            {isFetchingMore && (
              <div className="flex items-center justify-center py-6">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Filter;
