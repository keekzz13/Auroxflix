// src/store/searchStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Caches search state and results by query.
 * Results persist in sessionStorage, so navigating back is instant.
 */
export const useSearchStore = create(
  persist(
    (set, get) => ({
      searchQuery: '',
      hasSearched: false,
      // resultsByQuery: { [query]: { results: [], fetchedAt: number } }
      resultsByQuery: {},

      setQuery: (q) => set({ searchQuery: q }),
      setHasSearched: (v) => set({ hasSearched: v }),
      saveResults: (query, results) => {
        const map = get().resultsByQuery || {};
        set({
          resultsByQuery: {
            ...map,
            [query]: { results: results || [], fetchedAt: Date.now() },
          },
        });
      },
      clearAll: () =>
        set({
          searchQuery: '',
          hasSearched: false,
          resultsByQuery: {},
        }),
    }),
    {
      name: 'search-store-v1',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
