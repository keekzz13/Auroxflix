// src/pages/Search.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchTmdb } from '../utils.jsx';
import CarouselItem from '../components/carouselItem.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { SearchSkeleton } from '../components/Skeletons.jsx';
import { Search as SearchIcon } from 'lucide-react';
import { useSearchStore } from '../store/searchStore.js';

const DEBOUNCE_MS = 500;
const STALE_MS = 10 * 60 * 1000; // 10 minutes cache per query

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- Zustand store
  const {
    searchQuery,
    hasSearched,
    resultsByQuery,
    setQuery,
    setHasSearched,
    saveResults,
  } = useSearchStore();

  // ---- Local UI flags
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Restore from URL or store on mount
  useEffect(() => {
    const queryFromUrl = searchParams.get('query') || '';

    // Prefer URL if present (shareable links), else fall back to store
    if (queryFromUrl) {
      if (queryFromUrl !== searchQuery) {
        setQuery(queryFromUrl);
      }
      // Attempt to use cache for this query; if stale/missing, fetch
      loadFromCacheOrFetch(queryFromUrl);
    } else if (searchQuery) {
      // No URL param but we have a store query -> reflect it in URL
      setSearchParams({ query: searchQuery });
      loadFromCacheOrFetch(searchQuery);
    }

    if (inputRef.current) inputRef.current.focus();

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCached = (query) => {
    const entry = resultsByQuery?.[query];
    if (!entry) return null;
    const isFresh = Date.now() - (entry.fetchedAt || 0) < STALE_MS;
    return isFresh ? entry.results : null;
    // If you want "stale-while-revalidate", you could return results even if stale
  };

  const performSearch = async (query) => {
    if (!query.trim()) return;

    // Serve from cache if available and fresh
    const cached = getCached(query);
    if (cached) {
      setHasSearched(true);
      // no loading spinner when instant cache hit
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);
      setError(null);

      const searchRoute = `/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1`;
      const data = await fetchTmdb(searchRoute);

      const filteredResults = (data.results || []).filter(
        (item) =>
          (item.media_type === 'movie' || item.media_type === 'tv') &&
          item.vote_average > 0 &&
          item.vote_count >= 3
      );

      saveResults(query, filteredResults);
    } catch (err) {
      console.error('Error searching:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Try to use cache first; if absent, fetch
  const loadFromCacheOrFetch = async (query) => {
    const cached = getCached(query);
    if (cached) {
      setHasSearched(true);
      // No network needed
    } else {
      await performSearch(query);
    }
  };

  // Auto-search when typing (debounced) with caching + URL syncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        setSearchParams({ query: value });
        loadFromCacheOrFetch(value);
      } else {
        setSearchParams({});
        setHasSearched(false);
        // No need to clear cached queries; just stop showing results
      }
    }, DEBOUNCE_MS);
  };

  const effectiveResults = searchQuery ? resultsByQuery?.[searchQuery]?.results || [] : [];

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0">
      <Header />

      <div className="pt-8 md:pt-24 px-8 pb-8">
        <h1 className="text-4xl font-bold text-white mb-4">What do you feel like watching?</h1>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative w-full">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="Search for movies or TV shows..."
              className="w-full bg-white/10 text-white text-lg px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70" />
          </div>
        </div>

        {isLoading ? (
          <SearchSkeleton />
        ) : hasSearched && effectiveResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-white text-xl mb-4">No results found</div>
            <p className="text-gray-400 text-center max-w-md">
              Try searching for a different movie or TV show
            </p>
          </div>
        ) : hasSearched ? (
          <>
            <h2 className="text-2xl text-white mb-5">Search Results</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {effectiveResults
                .filter((item) => item.backdrop_path || item.poster_path)
                .map((item) => (
                  <CarouselItem key={`${item.media_type}-${item.id}`} item={item} usePoster={isMobile} />
                ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-white text-xl mb-4">Search for movies and TV shows</div>
            <p className="text-gray-400 text-center max-w-md">
              Enter a title in the search box above to find what you're looking for
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Search;
