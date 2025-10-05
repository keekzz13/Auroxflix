// src/pages/Watchlist.jsx
import React, { useEffect } from 'react';
import { fetchTmdb, getWatchlist, removeFromWatchlist } from '../utils.jsx';
import CarouselItem from '../components/carouselItem.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { SpotlightSkeleton } from '../components/Skeletons.jsx';
import { X } from 'lucide-react';
import { useWatchlistStore } from '../store/watchlistStore.js';

const makeSignature = (list) =>
  JSON.stringify(
    (list || [])
      .map((x) => ({ id: String(x.id), mediaType: x.mediaType }))
      .sort((a, b) => {
        // keep stable signature regardless of order
        if (a.mediaType === b.mediaType) return a.id.localeCompare(b.id);
        return a.mediaType.localeCompare(b.mediaType);
      })
  );

const Watchlist = () => {
  const {
    watchlistItems,
    detailedItems,
    isLoading,
    error,
    watchlistSignature,
    setWatchlistItems,
    setDetailedItems,
    setLoading,
    setError,
    setLastLoadedAt,
    setWatchlistSignature,
  } = useWatchlistStore();

  // Load/refresh watchlist + details (only when list actually changes)
  useEffect(() => {
    let cancelled = false;

    const loadWatchlist = async () => {
      try {
        setLoading({ isLoading: true, error: null });

        // NEW: async (Supabase or localStorage)
        const list = await getWatchlist();
        if (cancelled) return;

        const curSig = makeSignature(list);

        // Update base list in store
        setWatchlistItems(list);

        // If signature matches and we already have detailed items, skip refetch
        if (curSig === watchlistSignature && detailedItems.length > 0) {
          setLoading({ isLoading: false });
          return;
        }

        // Otherwise, fetch details for each item in parallel
        const detailedPromises = (list || []).map(async (item) => {
          try {
            const detailRoute = `/${item.mediaType}/${item.id}?language=en-US&append_to_response=images,content_ratings${
              item.mediaType === 'movie' ? ',release_dates' : ''
            }`;
            const detailedItem = await fetchTmdb(detailRoute);
            return { ...detailedItem, media_type: item.mediaType };
          } catch (err) {
            console.error(`Error fetching details for ${item.title}:`, err);
            // Fallback to basic data if details fail
            return {
              id: item.id,
              title: item.title,
              name: item.title,
              poster_path: item.posterPath,
              backdrop_path: item.backdropPath,
              media_type: item.mediaType,
            };
          }
        });

        const detailed = await Promise.all(detailedPromises);
        if (cancelled) return;

        setDetailedItems(detailed);
        setWatchlistSignature(curSig);
        setLastLoadedAt(Date.now());
      } catch (err) {
        console.error('Error loading watchlist:', err);
        setError(err.message || 'Failed to load watchlist');
      } finally {
        if (!cancelled) setLoading({ isLoading: false });
      }
    };

    loadWatchlist();

    // React to cross-tab updates to localStorage watchlist (anonymous users)
    const handleStorageChange = (e) => {
      if (e.key === 'watchlist') {
        loadWatchlist();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemoveFromWatchlist = async (itemId) => {
    // NEW: async removal (Supabase or localStorage)
    await removeFromWatchlist(itemId);

    // Immediately reflect in UI by updating store lists
    const updated = await getWatchlist();
    setWatchlistItems(updated);
    setDetailedItems((prev) => prev.filter((i) => String(i.id) !== String(itemId)));
    setWatchlistSignature(makeSignature(updated));
  };

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
        <h1 className="text-4xl font-bold text-white mb-8">My Watchlist</h1>

        {isLoading ? (
          <SpotlightSkeleton />
        ) : detailedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-white text-xl mb-4">Your watchlist is empty</div>
            <p className="text-gray-400 text-center max-w-md">
              Add movies and TV shows to your watchlist by clicking the + button when browsing
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {detailedItems.map((item) => (
              <div key={`${item.media_type}-${item.id}`} className="animate-scale-in relative group">
                <CarouselItem item={item} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromWatchlist(item.id);
                  }}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                  title="Remove from watchlist"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Watchlist;
