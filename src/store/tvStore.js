// src/store/tvStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * TV page store
 * - Caches categoryData + spotlight between navigations
 * - Persists to sessionStorage for instant restore in same tab
 */
export const useTvStore = create(
  persist(
    (set) => ({
      categoryData: {},      // { [title]: items[] }
      spotlightItem: null,

      isLoading: true,
      spotlightLoading: true,
      error: null,
      lastFetchedAt: 0,      // ms timestamp for staleness checks

      // actions
      setCategoryData: (data) => set({ categoryData: data }),
      setSpotlightItem: (item) => set({ spotlightItem: item }),
      setLoading: (partial) => set(partial),
      setError: (error) => set({ error }),
      setLastFetched: (ts) => set({ lastFetchedAt: ts }),

      reset: () =>
        set({
          categoryData: {},
          spotlightItem: null,
          isLoading: true,
          spotlightLoading: true,
          error: null,
          lastFetchedAt: 0,
        }),
    }),
    {
      name: 'tv-store-v1',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
