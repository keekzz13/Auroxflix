// src/store/filterStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Filter store
 * - Persists to sessionStorage (survives reload in same tab)
 * - Caches genres per media type
 * - Holds results + pagination so navigation back doesn't refetch
 */
export const useFilterStore = create(
  persist(
    (set, get) => ({
      // Filters / UI
      mediaType: 'movie',           // 'movie' | 'tv'
      selectedGenre: '',            // TMDB genre id as string
      year: '',                     // e.g. '2024'
      sortBy: 'popularity.desc',    // TMDB sort key

      // Data & cache
      results: [],                  // accumulated results (endless scroll)
      page: 1,                      // current loaded page
      totalPages: 1,                // last known total pages
      genresCache: { movie: [], tv: [] }, // cache genre lists per type

      // ---- Actions ----
      setFilters: (partial) => set(partial),

      setGenresForType: (type, list) => {
        const cache = get().genresCache || {};
        set({ genresCache: { ...cache, [type]: Array.isArray(list) ? list : [] } });
      },

      replaceResults: ({ results = [], page = 1, totalPages = 1 }) =>
        set({ results, page, totalPages }),

      appendResults: ({ results = [], page, totalPages }) => {
        const prev = get().results || [];
        set({
          results: [...prev, ...results],
          page: page ?? get().page,
          totalPages: totalPages ?? get().totalPages,
        });
      },

      clearFilters: () =>
        set({
          selectedGenre: '',
          year: '',
          sortBy: 'popularity.desc',
          // keep mediaType as-is to avoid surprising context switches
        }),

      resetAll: () =>
        set({
          mediaType: 'movie',
          selectedGenre: '',
          year: '',
          sortBy: 'popularity.desc',
          results: [],
          page: 1,
          totalPages: 1,
        }),
    }),
    {
      name: 'filter-store-v1',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      // If you ever change the shape, add a migrate() here to transform old state.
    }
  )
);
