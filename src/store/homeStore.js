// src/store/homeStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Home page store
 * - Persists to sessionStorage so navigating away/back is instant
 * - Caches category data + spotlight to avoid unnecessary refetches
 */
export const useHomeStore = create(
  persist(
    (set, get) => ({
      categoryData: {},          // { [title]: items[] }
      spotlightItem: null,
      continueWatchingItems: [], // can be set from page (computed locally)
      isLoading: true,
      spotlightLoading: true,
      error: null,
      lastFetchedAt: 0,          // ms timestamp for staleness checks

      // Actions
      setCategoryData: (data) => set({ categoryData: data }),
      setSpotlightItem: (item) => set({ spotlightItem: item }),
      setContinueWatchingItems: (items) => set({ continueWatchingItems: items }),
      setLoading: (partial) => set(partial),
      setError: (error) => set({ error }),
      setLastFetched: (ts) => set({ lastFetchedAt: ts }),

      reset: () =>
        set({
          categoryData: {},
          spotlightItem: null,
          continueWatchingItems: [],
          isLoading: true,
          spotlightLoading: true,
          error: null,
          lastFetchedAt: 0,
        }),
    }),
    {
      name: 'home-store-v1',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
