// src/pages/browse/Movies.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchTmdb,
  getTmdbImage,
  formatReleaseDate,
  getContentRating,
  isInWatchlist,
  toggleWatchlist
} from '../../utils.jsx';
import { Play, ThumbsUp, Plus, Info, Search } from 'lucide-react';
import { toast } from 'sonner';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import QuickSearch from '../../components/QuickSearch.jsx';
import { SpotlightSkeleton } from '../../components/Skeletons.jsx';
import EnhancedCategorySection from '../../components/enhanced-carousel.jsx';
import config from '../../config.json';
import { useMoviesStore } from '../../store/moviesStore.js';

const { tmdbBaseUrl } = config;

// consider data "fresh" for this long (prevents refetch when navigating back)
const STALE_MS = 5 * 60 * 1000; // 5 minutes

const movieCategories = [
  {
    title: 'Action',
    url: `${tmdbBaseUrl}/discover/movie?with_genres=28&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl,
    updateHero: true
  },
  {
    title: 'Comedy',
    url: `${tmdbBaseUrl}/discover/movie?with_genres=35&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Drama',
    url: `${tmdbBaseUrl}/discover/movie?with_genres=18&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Sci-Fi',
    url: `${tmdbBaseUrl}/discover/movie?with_genres=878&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Horror',
    url: `${tmdbBaseUrl}/discover/movie?with_genres=27&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Animation',
    url: `${tmdbBaseUrl}/discover/movie?with_genres=16&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Upcoming',
    url: `${tmdbBaseUrl}/movie/upcoming?language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Now Playing',
    url: `${tmdbBaseUrl}/movie/now_playing?language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  }
];

const SpotlightSection = ({ item, isLoading, onQuickSearchOpen }) => {
  const [inWatchlist, setInWatchlist] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (item && item.id) { setInWatchlist(isInWatchlist(item.id)); }
  }, [item]);
  
  if (isLoading || !item) {
    return <SpotlightSkeleton />;
  }
  
  const backgroundImage = getTmdbImage(item.backdrop_path) || getTmdbImage(item.poster_path);
  const logoImage = item.images?.logos?.find(logo => logo.iso_639_1 === 'en')?.file_path;
  const mediaType = item.title ? 'movie' : 'tv';
  
  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    const isAdded = toggleWatchlist(item);
    setInWatchlist(isAdded);
  };

  const handleWatchClick = () => { navigate(`/${mediaType}/${item.id}?watch=1`); };
  const handleInfoClick = () => { navigate(`/${mediaType}/${item.id}`); };
  const handleLikeClick = () => { toast(`Liked ${item.title || item.name}`); };

  return (
    <div
      id="spotlight"
      className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] bg-cover bg-center bg-no-repeat flex items-end animate-slide-up"
      style={{backgroundImage: `url('${backgroundImage}')`}}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0a]/70 via-black/20 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0a]/80 via-black/40 md:via-black/20 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#090a0a]/80 md:from-[#090a0a]/60 via-[#090a0a]/10 to-transparent"></div>

      {/* QuickSearch Bubble - Desktop Only (match Home UI) */}
      <div className="hidden md:block absolute top-18 left-1/2 transform -translate-x-1/2 z-20 animate-fade-in-delayed backdrop-blur-sm">
        <div
          className="bg-white/10 border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg cursor-pointer hover:bg-white/15 transition-all duration-200"
          onClick={onQuickSearchOpen}
        >
          <div className="flex items-center gap-1">
            <Search className="w-4 h-4 text-white" />
          </div>
          <span className="text-white text-sm font-medium">
            Press <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Ctrl+G</kbd> to quickly search movies/tv from anywhere
          </span>
        </div>
      </div>

      {/* Content container */}
      <div className="relative z-10 p-4 md:p-8 pb-0 w-full md:pl-8 md:pr-0 md:text-left text-center">
        {logoImage ? (
          <img src={getTmdbImage(logoImage) || "/placeholder.svg"} className="w-[80%] md:max-h-72 max-w-sm min-w-[13rem] mb-4 animate-fade-in-delayed mx-auto md:mx-0" alt={item.title || item.name} />
        ) : (
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 w-full md:w-[24rem] animate-fade-in-delayed">
            {item.title || item.name}
          </h1>
        )}
        
        {/* Rating and info */}
        <div className="flex items-center gap-1 sm:gap-2 mb-4 animate-fade-in-delayed-2 justify-center md:justify-start flex-wrap">
          <div className="bg-gradient-to-r from-[#90cea1] to-[#01b4e4] text-black px-1 py-[1px] rounded font-black tracking-tighter text-sm">TMDB</div>
          <span className="text-neutral-300 text-sm sm:text-base">{item.vote_average?.toFixed(1) || '8.0'}</span>
          <span className="text-neutral-300">•</span>
          <span className="text-neutral-300 text-sm sm:text-base">{formatReleaseDate(item.release_date || item.first_air_date)}</span>
          <span className="text-neutral-300 hidden sm:inline">•</span>
          <span className="text-neutral-300 text-sm sm:text-base hidden sm:inline">
            {item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : 
             item.number_of_seasons ? `${item.number_of_seasons} seasons` : '0-100 seasons'}
          </span>
          <span className="text-neutral-300 hidden sm:inline">•</span>
          <span className="text-green-400 text-sm sm:text-base hidden sm:inline">100% match</span>
        </div>
        
        {/* Description */}
        <p className="text-white text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-16 leading-5 sm:leading-6 max-w-xl line-clamp-3 overflow-ellipsis animate-fade-in-delayed-3 mx-auto md:mx-0">
          {item.overview}
        </p>
        
        {/* Action buttons */}
        <div className="flex flex-col md:flex-row mb-4 w-full md:justify-between items-center gap-4 animate-fade-in-delayed-4">
          <div className="flex items-center gap-2 justify-center">
            <button onClick={handleWatchClick} className="bg-white text-black px-4 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-lg flex items-center gap-2 hover:bg-neutral-200 transition-all cursor-pointer">
              <Play className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" />
              Watch now
            </button>
            <button onClick={handleInfoClick} className="bg-white/15 text-white p-2 sm:p-2.5 rounded-full hover:bg-white/25 transition-all cursor-pointer">
              <Info className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            <button onClick={handleLikeClick} className="bg-white/15 text-white p-2 sm:p-2.5 rounded-full hover:bg-white/25 transition-all cursor-pointer">
              <ThumbsUp className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={handleWatchlistToggle}
              className={`text-white p-2 sm:p-2.5 rounded-full transition-all cursor-pointer ${inWatchlist ? 'bg-white/25' : 'bg-white/15 hover:bg-white/25'}`}
            >
              <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="bg-white/15 text-white p-2 pl-3 pr-12 font-light">{getContentRating(item)}</span>
          </div>
        </div>
        
        {/* Genre tags */}
        <div className="flex gap-2 text-neutral-600 text-xs sm:text-sm mb-3 animate-fade-in-delayed-5 justify-center md:justify-start flex-wrap">
          {
            item.genres.slice(0, 3).map((genre, index) => (
              <React.Fragment key={genre.id}>
                <span>{genre.name}</span>
                {index < Math.min(item.genres.length - 1, 2) && <span>•</span>}
              </React.Fragment>
            ))
          }
        </div>
      </div>
    </div>
  );
};

const Movies = () => {
  // Zustand store
  const {
    categoryData,
    spotlightItem,
    isLoading,
    spotlightLoading,
    error,
    lastFetchedAt,
    setCategoryData,
    setSpotlightItem,
    setLoading,
    setError,
    setLastFetched
  } = useMoviesStore();

  // QuickSearch modal state (match Home/TV)
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const handleQuickSearchOpen = () => setIsQuickSearchOpen(true);

  // Load data if not fresh / not cached
  useEffect(() => {
    const now = Date.now();
    const isFresh = now - (lastFetchedAt || 0) < STALE_MS;
    const hasCached = Object.keys(categoryData || {}).length > 0 && !!spotlightItem;

    if (isFresh && hasCached) {
      // Ensure loading flags off when restoring from cache
      setLoading({ isLoading: false, spotlightLoading: false });
      return;
    }

    const loadData = async () => {
      try {
        setLoading({ isLoading: true, spotlightLoading: true, error: null });

        const promises = movieCategories.map(async (category) => {
          const route = category.url.replace(category.detailUrl, '');
          const data = await fetchTmdb(route);
          return { ...category, data: data.results || [] };
        });

        const results = await Promise.all(promises);
        const newCategoryData = {};
        let heroDetailedSet = false;

        results.forEach((result) => {
          newCategoryData[result.title] = result.data;

          if (result.updateHero && result.data.length > 0 && !heroDetailedSet) {
            heroDetailedSet = true;
            const heroItem = result.data[0];
            const detailRoute = `/movie/${heroItem.id}?language=en-US&append_to_response=images,content_ratings,release_dates&include_image_language=en`;

            fetchTmdb(detailRoute)
              .then((detailedItem) => {
                setSpotlightItem(detailedItem);
                setLoading({ spotlightLoading: false });
              })
              .catch((err) => {
                console.error('Error fetching detailed hero data:', err);
                setSpotlightItem(heroItem);
                setLoading({ spotlightLoading: false });
              });
          }
        });

        setCategoryData(newCategoryData);
        setLoading({ isLoading: false });
        setLastFetched(Date.now());
      } catch (err) {
        setError(err.message || 'Failed to load');
        setLoading({ isLoading: false, spotlightLoading: false });
        console.error('Error loading data:', err);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      
      <SpotlightSection item={spotlightItem} isLoading={spotlightLoading} onQuickSearchOpen={handleQuickSearchOpen} />
      
      <div className="px-2 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
        {movieCategories.map((category, index) => {
          const items = categoryData[category.title] || [];
          return (
            <div key={category.title} className="animate-stagger" style={{animationDelay: `${index * 200}ms`}}>
              <EnhancedCategorySection 
                title={category.title}
                items={items}
                isLoading={isLoading}
              />
            </div>
          );
        })}
      </div>
      
      <Footer />

      {/* QuickSearch Component */}
      <QuickSearch isOpen={isQuickSearchOpen} onOpenChange={setIsQuickSearchOpen} />
    </div>
  );
};

export default Movies;
