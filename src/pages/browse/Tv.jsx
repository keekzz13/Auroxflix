// src/pages/browse/tv.jsx

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
import { Play, ThumbsUp, Plus, Info, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import CarouselItem from '../../components/carouselItem.jsx';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import QuickSearch from '../../components/QuickSearch.jsx';
import { SpotlightSkeleton, CategorySkeleton } from '../../components/Skeletons.jsx';
import config from '../../config.json';
import { useTvStore } from '../../store/tvStore.js';

const { tmdbBaseUrl } = config;

// consider data "fresh" for this long (prevents refetch when navigating back)
const STALE_MS = 5 * 60 * 1000; // 5 minutes

const tvCategories = [
  {
    title: 'Comedy',
    url: `${tmdbBaseUrl}/discover/tv?with_genres=35&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl,
    updateHero: true
  },
  {
    title: 'Drama',
    url: `${tmdbBaseUrl}/discover/tv?with_genres=18&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl,
  },
  {
    title: 'Crime',
    url: `${tmdbBaseUrl}/discover/tv?with_genres=80&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Sci-Fi & Fantasy',
    url: `${tmdbBaseUrl}/discover/tv?with_genres=10765&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Action & Adventure',
    url: `${tmdbBaseUrl}/discover/tv?with_genres=10759&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Animation',
    url: `${tmdbBaseUrl}/discover/tv?with_genres=16&language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'Airing Today',
    url: `${tmdbBaseUrl}/tv/airing_today?language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
    detailUrl: tmdbBaseUrl
  },
  {
    title: 'On The Air',
    url: `${tmdbBaseUrl}/tv/on_the_air?language=en-US&page=1&append_to_response=images,content_ratings&include_image_language=en`,
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
      className="relative w-full h-[80vh] bg-cover bg-center bg-no-repeat flex items-end animate-slide-up"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
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

      <div className="relative z-10 p-4 md:p-8 pb-0 w-full md:pl-8 md:pr-0 md:text-left text-center">
        {logoImage ? (
          <img src={getTmdbImage(logoImage)} className="w-[80%] md:max-h-72 max-w-sm min-w-[13rem] mb-4 animate-fade-in-delayed mx-auto md:mx-0" alt={item.title || item.name} />
        ) : (
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 w-full md:w-[24rem] animate-fade-in-delayed">
            {item.title || item.name}
          </h1>
        )}
        
        <div className="flex items-center gap-2 mb-4 animate-fade-in-delayed-2 justify-center md:justify-start">
          <div className="bg-gradient-to-r from-[#90cea1] to-[#01b4e4] text-black px-1 py-[1px] rounded font-black tracking-tighter text-sm">TMDB</div>
          <span className="text-neutral-300">{item.vote_average?.toFixed(1) || '8.0'}</span>
          <span className="text-neutral-300">•</span>
          <span className="text-neutral-300">{formatReleaseDate(item.release_date || item.first_air_date)}</span>
          <span className="text-neutral-300">•</span>
          <span className="text-neutral-300">
            {item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : 
             item.number_of_seasons ? `${item.number_of_seasons} seasons` : '0-100 seasons'}
          </span>
          <span className="text-neutral-300">•</span>
          <span className="text-green-400">100% match</span>
        </div>
        
        <p className="text-white text-base md:text-lg mb-8 md:mb-16 leading-6 max-w-xl line-clamp-3 overflow-ellipsis animate-fade-in-delayed-3 mx-auto md:mx-0">
          {item.overview}
        </p>
        
        <div className="flex flex-col md:flex-row mb-4 w-full md:justify-between items-center gap-4 animate-fade-in-delayed-4">
          <div className="flex items-center gap-2 justify-center">
            <button onClick={handleWatchClick} className="bg-white text-black px-6 py-2 rounded-full font-semibold text-lg flex items-center gap-2 hover:bg-neutral-200 transition-all cursor-pointer">
              <Play className="w-6 h-6" fill="currentColor" />
              Watch now
            </button>
            <button onClick={handleInfoClick} className="bg-white/15 text-white p-2.5 rounded-full hover:bg-white/25 transition-all cursor-pointer">
              <Info className="w-6 h-6" />
            </button>
            <button onClick={handleLikeClick} className="bg-white/15 text-white p-2.5 rounded-full hover:bg-white/25 transition-all cursor-pointer">
              <ThumbsUp className="w-6 h-6" />
            </button>
            <button 
              onClick={handleWatchlistToggle}
              className={`text-white p-2.5 rounded-full transition-all cursor-pointer ${inWatchlist ? 'bg-white/25' : 'bg-white/15 hover:bg-white/25'}`}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="bg-white/15 text-white p-2 pl-3 pr-12 font-light">{getContentRating(item)}</span>
          </div>
        </div>
        
        <div className="flex gap-2 text-neutral-600 text-sm mb-3 animate-fade-in-delayed-5 justify-center md:justify-start">
          {item.genres.slice(0, 3).map((genre, index) => (
            <React.Fragment key={genre.id}>
              <span>{genre.name}</span>
              {index < Math.min(item.genres.length - 1, 2) && <span>•</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const MediaCard = ({ item }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => { setIsMobile(window.innerWidth < 768); };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className="flex-shrink-0 w-40 md:w-96 cursor-pointer animate-scale-in">
      <CarouselItem item={item} usePoster={isMobile} />
    </div>
  );
};

const CategorySection = ({ title, items, isLoading: categoryLoading }) => {
  const [visibleItems, setVisibleItems] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = React.useRef(null);

  const handleScroll = (e) => {
    const container = e.target;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    if (scrollLeft + clientWidth >= scrollWidth - 200 && !isLoading && visibleItems < items.length) {
      setIsLoading(true);
      setVisibleItems(prev => Math.min(prev + 4, items.length));
      setIsLoading(false);
    }
  };

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const displayedItems = items.slice(0, visibleItems);

  if (categoryLoading) {
    return <CategorySkeleton title={title} />;
  }

  return (
    <div className="mb-8 animate-slide-up relative">
      <h2 className="text-2xl text-white mb-1">{title}</h2>
      <div className="relative group">
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition hidden group-hover:block"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide py-4 pl-4 -ml-4 scroll-smooth"
          onScroll={handleScroll}
        >
          {displayedItems.map((item, index) => (
            <div key={item.id} className="animate-stagger" style={{ animationDelay: `${index * 100}ms` }}>
              <MediaCard item={item} />
            </div>
          ))}
          {isLoading && (
            <div className="flex-shrink-0 w-96 h-56 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-solid border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition hidden group-hover:block"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

const Tv = () => {
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
  } = useTvStore();

  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const handleQuickSearchOpen = () => setIsQuickSearchOpen(true);

  useEffect(() => {
    const now = Date.now();
    const isFresh = now - (lastFetchedAt || 0) < STALE_MS;
    const hasCached = Object.keys(categoryData || {}).length > 0 && !!spotlightItem;

    if (isFresh && hasCached) {
      // restore flags when using cache
      setLoading({ isLoading: false, spotlightLoading: false });
      return;
    }

    const loadData = async () => {
      try {
        setLoading({ isLoading: true, spotlightLoading: true, error: null });
        const promises = tvCategories.map(async (category) => {
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
            const detailRoute = `/tv/${heroItem.id}?language=en-US&append_to_response=images,content_ratings&include_image_language=en`;
            fetchTmdb(detailRoute).then(detailedItem => {
              setSpotlightItem(detailedItem);
              setLoading({ spotlightLoading: false });
            }).catch(err => {
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
      <div className="px-8 py-8 space-y-8">
        {tvCategories.map((category, index) => {
          const items = categoryData[category.title] || [];
          return (
            <div key={category.title} className="animate-stagger" style={{ animationDelay: `${index * 200}ms` }}>
              <CategorySection 
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

export default Tv;
