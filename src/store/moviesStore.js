// src/store/moviesStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Movies page store
 * - Caches categoryData + spotlight
 * - Persists to sessionStorage so navigating away/back is instant
 */
export const useMoviesStore = create(
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
      name: 'movies-store-v1',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
