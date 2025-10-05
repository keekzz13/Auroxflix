// src/store/watchlistStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Watchlist store
 * - Caches: raw watchlist items (ids/type), detailed items (cards), loading flags
 * - Persists to sessionStorage for instant restore in same tab
 * - Tracks a "signature" of the watchlist to avoid unnecessary re-fetches
 */
export const useWatchlistStore = create(
  persist(
    (set) => ({
      watchlistItems: [],     // [{ id, title, mediaType, posterPath, backdropPath }]
      detailedItems: [],      // API-detailed items for rendering
      isLoading: true,
      error: null,

      lastLoadedAt: 0,        // ms timestamp (informational)
      watchlistSignature: '', // JSON string of ids/mediaType to check for changes

      // actions
      setWatchlistItems: (items) => set({ watchlistItems: items }),
      setDetailedItems: (items) => set({ detailedItems: items }),
      setLoading: (partial) => set(partial),
      setError: (error) => set({ error }),
      setLastLoadedAt: (ts) => set({ lastLoadedAt: ts }),
      setWatchlistSignature: (sig) => set({ watchlistSignature: sig }),

      reset: () =>
        set({
          watchlistItems: [],
          detailedItems: [],
          isLoading: true,
          error: null,
          lastLoadedAt: 0,
          watchlistSignature: '',
        }),
    }),
    {
      name: 'watchlist-store-v1',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
