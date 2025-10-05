import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { extractSpotlights } from '../../components/anime/spotlightData.jsx';
import { fetchAnimeData } from '../../components/anime/animeData.jsx';
import { AnimeCard } from '../../components/anime/ui/card.jsx';
import AnimeHeader from '../../components/anime/ui/header.jsx';
import { AnimeSpotlightSkeleton } from '../../components/Skeletons.jsx';

export default function AnimeHome() {
  const [spotlights, setSpotlights] = useState([]);
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('trending');
  const [animeData, setAnimeData] = useState([]);
  const [sidebarData, setSidebarData] = useState({
    recentlyAdded: [],
    recentlyUpdated: [],
    topUpcoming: []
  });
  const [loading, setLoading] = useState(true);
  const [spotlightLoading, setSpotlightLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const spotlightInterval = useRef(null);
  const loadedCategories = useRef(new Set());

  useEffect(() => {
    document.body.style.backgroundColor = 'var(--color-anime-background)';
    document.body.style.fontFamily = 'Inter, sans-serif';
    
    loadInitialData();
    
    return () => {
      if (spotlightInterval.current) {
        clearInterval(spotlightInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (spotlights.length > 1) {
      startSpotlightInterval();
    }
    return () => {
      if (spotlightInterval.current) {
        clearInterval(spotlightInterval.current);
      }
    };
  }, [spotlights]);
//
  const loadInitialData = async () => {
    try {
      // Load spotlight and trending data first (most important)
      const [spotlightData, trendingData] = await Promise.all([
        extractSpotlights(),
        fetchAnimeData('top-airing')
      ]);

      setSpotlights(spotlightData || []);
      setSpotlightLoading(false);
      setAnimeData(trendingData?.results || []);
      loadedCategories.current.add('trending');
      setLoading(false);

      // Load sidebar data in the background (less critical)
      loadSidebarData();
    } catch (error) {
      console.error('Error loading initial data:', error);
      setSpotlightLoading(false);
      setLoading(false);
    }
  };

  const loadSidebarData = async () => {
    try {
      setSidebarLoading(true);
      
      // Load sidebar data sequentially to reduce server load
      const recentlyAddedData = await fetchAnimeData('recently-added');
      setSidebarData(prev => ({
        ...prev,
        recentlyAdded: recentlyAddedData?.results?.slice(0, 5) || []
      }));

      const recentlyUpdatedData = await fetchAnimeData('recently-updated');
      setSidebarData(prev => ({
        ...prev,
        recentlyUpdated: recentlyUpdatedData?.results?.slice(0, 5) || []
      }));

      const topUpcomingData = await fetchAnimeData('top-upcoming');
      setSidebarData(prev => ({
        ...prev,
        topUpcoming: topUpcomingData?.results?.slice(0, 5) || []
      }));
    } catch (error) {
      console.error('Error loading sidebar data:', error);
    } finally {
      setSidebarLoading(false);
    }
  };

  const loadAnimeData = async (category) => {
    // Check if we already have this category loaded
    if (loadedCategories.current.has(category)) {
      return;
    }

    setLoading(true);
    let endpoint = '';
    
    switch(category) {
      case 'trending':
        endpoint = 'top-airing';
        break;
      case 'popular':
        endpoint = 'most-popular';
        break;
      case 'toprated':
        endpoint = 'most-favorite';
        break;
      default:
        endpoint = 'top-airing';
    }
    
    try {
      const { results } = await fetchAnimeData(endpoint);
      setAnimeData(results || []);
      loadedCategories.current.add(category);
    } catch (error) {
      console.error(`Error loading ${category} anime:`, error);
      setAnimeData([]);
    } finally {
      setLoading(false);
    }
  };

  const startSpotlightInterval = () => {
    if (spotlightInterval.current) {
      clearInterval(spotlightInterval.current);
    }
    spotlightInterval.current = setInterval(() => {
      setCurrentSpotlightIndex(prev => (prev + 1) % spotlights.length);
    }, 7000);
  };

  const showNextSpotlight = () => {
    setCurrentSpotlightIndex(prev => (prev + 1) % spotlights.length);
    startSpotlightInterval();
  };

  const showPreviousSpotlight = () => {
    setCurrentSpotlightIndex(prev => (prev - 1 + spotlights.length) % spotlights.length);
    startSpotlightInterval();
  };

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    loadAnimeData(category);
  };

  const currentSpotlight = spotlights[currentSpotlightIndex];

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="rounded-lg overflow-hidden shadow-lg aspect-[2/3] animate-pulse">
          <div className="w-full h-full bg-anime-card-bg"></div>
        </div>
      ))}
    </div>
  );

  const renderSidebarSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-anime-card-bg p-3 rounded-lg flex items-center space-x-3 animate-pulse">
          <div className="flex-shrink-0 w-12 h-16 bg-anime-skeleton-bg rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-anime-skeleton-bg rounded w-3/4"></div>
            <div className="h-2 bg-anime-skeleton-bg rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSidebarAnimeItem = (anime, index) => (
    <Link
      key={anime.id}
      to={`/anime/${anime.id}`}
      className="bg-anime-card-bg p-3 rounded-lg flex items-center space-x-3 hover:bg-anime-card-hover transition duration-200"
    >
      <div className="flex-shrink-0">
        <img
          src={anime.poster || 'https://placehold.co/48x64/141414/fff/?text=No+Image&font=poppins'}
          alt={anime.title}
          className="w-12 h-16 object-cover rounded"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{anime.title}</h4>
        <p className="text-xs text-gray-400 mb-1">{anime.tvInfo?.showType || 'Anime'}</p>
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs bg-anime-badge-bg border border-anime-badge-border px-1.5 py-0.5 rounded-md hover:bg-white hover:text-anime-badge-bg transition duration-200 cursor-pointer">
            HD
          </span>
          {anime.tvInfo?.sub && (
            <span className="text-xs bg-anime-badge-bg border border-anime-badge-border px-1.5 py-0.5 rounded-md flex items-center justify-center group hover:bg-white hover:text-anime-badge-bg transition duration-200 cursor-pointer">
              <span className="bg-white text-black px-1 pt-[0.08rem] pb-[0.03rem] rounded-sm mr-1 text-[0.5rem] group-hover:bg-anime-badge-bg group-hover:text-white">
                CC
              </span>
              {anime.tvInfo.sub}
            </span>
          )}
          {anime.tvInfo?.dub && (
            <span className="text-xs bg-anime-badge-bg border border-anime-badge-border px-1.5 py-0.5 rounded-md flex items-center justify-center group hover:bg-white hover:text-anime-badge-bg transition duration-200 cursor-pointer">
              <span className="bg-white text-black px-1 pt-[0.08rem] pb-[0.03rem] rounded-sm mr-1 text-[0.5rem] group-hover:bg-anime-badge-bg group-hover:text-white">
                DUB
              </span>
              {anime.tvInfo.dub}
            </span>
          )}
          {anime.duration && (
            <span className="text-xs bg-anime-badge-bg border border-anime-badge-border px-1.5 py-0.5 rounded-md hover:bg-white hover:text-anime-badge-bg transition duration-200 cursor-pointer">
              {anime.duration}
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <AnimeHeader />

      <main className="p-2 md:p-4 md:pt-6 mt-16">
        {/* Hero Section */}
        {spotlightLoading || !currentSpotlight ? (
          <AnimeSpotlightSkeleton />
        ) : (
          <section 
            className="relative bg-cover bg-center rounded-2xl overflow-hidden h-[55vh] mb-4"
            style={{
              backgroundImage: `url('${currentSpotlight?.poster || 'https://placehold.co/1200x500/0e1117/fff/?text=Loading...&font=poppins'}')`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-anime-background/90 via-anime-background/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-3/5 lg:w-1/2 z-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                {currentSpotlight?.title || 'Loading...'}
              </h1>
              <p className="text-md md:text-lg text-gray-200 mb-6 font-normal leading-6 overflow-hidden line-clamp-3 text-ellipsis">
                {currentSpotlight?.description ? 
                  `${currentSpotlight.description.substring(0, 220)}${currentSpotlight.description.length > 220 ? '...' : ''}` : 
                  'Loading description...'
                }
              </p>
              <div className="flex items-center space-x-3">
                <Link
                  to={`/anime/${currentSpotlight?.id || ''}`}
                  className="bg-white text-black px-[1.2rem] py-[0.5rem] text-[1.1rem] rounded-lg font-semibold hover:bg-zinc-200 transition hover:scale-[1.075] active:scale-95"
                >
                  Watch now
                </Link>
                <Link
                  to={`/anime/${currentSpotlight?.id || ''}`}
                  className="bg-anime-button-bg/30 border border-anime-border/10 text-white px-[1.2rem] py-[0.5rem] text-[1.1rem] rounded-lg font-medium hover:bg-anime-button-bg/50 transition backdrop-blur-sm hover:scale-[1.075] active:scale-95"
                >
                  Details
                </Link>
              </div>
            </div>
            <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex space-x-2 z-10">
              <button
                onClick={showPreviousSpotlight}
                className="bg-anime-button-bg/30 border border-anime-border/10 text-white p-[0.5rem] text-[1.1rem] rounded-lg font-medium hover:bg-anime-button-bg/50 transition backdrop-blur-sm hover:scale-[1.075] active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={showNextSpotlight}
                className="bg-anime-button-bg/30 border border-anime-border/10 text-white p-[0.5rem] text-[1.1rem] rounded-lg font-medium hover:bg-anime-button-bg/50 transition backdrop-blur-sm hover:scale-[1.075] active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow lg:w-3/4 bg-anime-modal-bg p-6 rounded-2xl">
            <div className="flex space-x-1 mb-6 border-b border-anime-border/10">
              {[
                { key: 'trending', label: 'Trending' },
                { key: 'popular', label: 'Popular' },
                { key: 'toprated', label: 'Top rated' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleCategoryChange(tab.key)}
                  className={`px-4 py-2 font-semibold ${
                    currentCategory === tab.key
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? renderSkeletonGrid() : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {animeData.map((anime, index) => (
                  <AnimeCard key={anime.id} animeData={anime} />
                ))}
              </div>
            )}
          </div>

          <aside className="lg:w-2/5 bg-anime-modal-bg p-6 rounded-2xl h-full">
            <div className="w-full space-y-6">
              {/* Recently Added Section */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  Recently Added
                </h3>
                {loading ? renderSidebarSkeleton() : (
                  <div className="space-y-3">
                    {sidebarData.recentlyAdded.map((anime, index) => 
                      renderSidebarAnimeItem(anime, index)
                    )}
                  </div>
                )}
              </div>
              
              {/* Recently Updated Section */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  Recently Updated
                </h3>
                {loading ? renderSidebarSkeleton() : (
                  <div className="space-y-3">
                    {sidebarData.recentlyUpdated.map((anime, index) => 
                      renderSidebarAnimeItem(anime, index)
                    )}
                  </div>
                )}
              </div>
              
              {/* Top Upcoming Section */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  Top Upcoming
                </h3>
                {loading ? renderSidebarSkeleton() : (
                  <div className="space-y-3">
                    {sidebarData.topUpcoming.map((anime, index) => 
                      renderSidebarAnimeItem(anime, index)
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
