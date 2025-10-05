import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAnimeInfo, fetchEpisodesList } from '../../components/anime/animeData.jsx';
import { getSourceUrl, getDefaultSource, animeSources } from './sources.jsx';
import { extractSeasonNumber, findTmdbIdForSeason } from '../../components/anime/animeDetailsData.jsx';
import { fetchEpisodeThumbnails } from '../../components/anime/episodeThumbnails.jsx';
import AnimeHeader from '../../components/anime/ui/header.jsx';
import AnimeDetailsModal from '../../components/anime/ui/animeDetailsModal.jsx';

export default function AnimeDetails() {
  const { id } = useParams();
  const [animeData, setAnimeData] = useState(null);
  const [episodesData, setEpisodesData] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [currentSource, setCurrentSource] = useState(getDefaultSource());
  const [currentLanguage, setCurrentLanguage] = useState('sub');
  const [currentSeason, setCurrentSeason] = useState(1);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [episodeThumbnails, setEpisodeThumbnails] = useState({});
  const loadedSeasons = useRef(new Set());
  const thumbnailsLoaded = useRef(false);

  useEffect(() => {
    document.body.style.backgroundColor = 'var(--color-anime-background)';
    // Reset state when navigating to a new anime
    setEpisodeThumbnails({});
    thumbnailsLoaded.current = false;
    loadedSeasons.current.clear();
    loadAnimeData();
  }, [id]);

  useEffect(() => {
    // Only fetch thumbnails once per anime and if we have the required data
    if (animeData && episodesData?.episodes && !thumbnailsLoaded.current) {
      fetchEpisodeThumbnailsData();
      thumbnailsLoaded.current = true;
    }
  }, [animeData, episodesData]);

  const fetchEpisodeThumbnailsData = async () => {
    if (!animeData?.title || !episodesData?.episodes) return;

    try {
      console.log('Fetching episode thumbnails for:', animeData.title);
      
      // Use the current season's title for better TMDB matching
      const searchQuery = animeData.seasons && animeData.seasons.length > 0 ? 
        animeData.seasons[0].name : animeData.title;

      // Get enhanced TMDB data for the current season
      const tmdbSearchResult = await findTmdbIdForSeason(searchQuery);
      
      if (tmdbSearchResult?.tmdbId) {
        console.log('Found TMDB data for initial load:', tmdbSearchResult);
        
        const thumbnails = await fetchEpisodeThumbnails(
          episodesData.episodes.length,
          tmdbSearchResult.seasonNumber,
          searchQuery
        );

        if (thumbnails) {
          console.log('Successfully fetched initial thumbnails:', thumbnails.length);
          const thumbnailsMap = {};
          thumbnails.forEach(thumb => {
            if (thumb.thumbnail) {
              thumbnailsMap[thumb.episode_no] = {
                thumbnail: thumb.thumbnail,
                name: thumb.name,
                description: thumb.description,
                tmdbId: tmdbSearchResult.tmdbId
              };
            }
          });
          setEpisodeThumbnails(thumbnailsMap);
        } else {
          console.log('No thumbnails found for initial load');
        }
      } else {
        console.log('No TMDB match found for initial load');
      }
    } catch (error) {
      console.error('Error fetching episode thumbnails:', error);
    }
  };

  const loadAnimeData = async () => {
    try {
      setLoading(true);

      const [animeInfo, episodesList] = await Promise.all([
        fetchAnimeInfo(id),
        fetchEpisodesList(id)
      ]);

      if (!animeInfo) {
        throw new Error('Failed to fetch anime data');
      }

      setAnimeData(animeInfo);
      setEpisodesData(episodesList);
      loadedSeasons.current.add(id);

      if (episodesList?.episodes && episodesList.episodes.length > 0) {
        setCurrentEpisode(episodesList.episodes[0]);
      }

      // Set initial season
      if (animeInfo.seasons && animeInfo.seasons.length > 0) {
        const firstSeasonNumber = extractSeasonNumber(animeInfo.seasons[0].name);
        setCurrentSeason(firstSeasonNumber);
      }

    } catch (err) {
      console.error('Error loading anime details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonChange = async (seasonRoute) => {
    if (!seasonRoute || seasonRoute === '') return;
    
    try {
      setEpisodesLoading(true);
      setEpisodeThumbnails({}); // Clear existing thumbnails
      thumbnailsLoaded.current = false; // Reset thumbnail loading flag
      
      // Extract season ID from route
      const seasonId = seasonRoute;
      
      // Fetch new episodes data for the selected season
      const [newAnimeInfo, newEpisodesData] = await Promise.all([
        fetchAnimeInfo(seasonId),
        fetchEpisodesList(seasonId)
      ]);

      if (newAnimeInfo && newEpisodesData) {
        // Update anime data with new season info
        setAnimeData(prevData => ({
          ...prevData,
          ...newAnimeInfo,
          seasons: prevData.seasons // Keep original seasons list
        }));
        
        setEpisodesData(newEpisodesData);
        loadedSeasons.current.add(seasonRoute);
        
        // Reset to first episode of new season
        if (newEpisodesData.episodes && newEpisodesData.episodes.length > 0) {
          setCurrentEpisode(newEpisodesData.episodes[0]);
        }
        
        // Update current season
        const seasonNumber = extractSeasonNumber(newAnimeInfo.title);
        setCurrentSeason(seasonNumber);

        // Fetch new TMDB data and episode thumbnails for the new season
        await fetchSeasonSpecificTmdbData(newAnimeInfo, newEpisodesData.episodes);
      }
    } catch (error) {
      console.error('Error changing season:', error);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const fetchSeasonSpecificTmdbData = async (seasonAnimeData, episodes) => {
    if (!seasonAnimeData?.title || !episodes?.length) return;

    try {
      console.log('Fetching season-specific TMDB data for:', seasonAnimeData.title);
      
      // Use the new season's title to search for TMDB data
      const searchQuery = seasonAnimeData.title;
      const seasonNumber = extractSeasonNumber(seasonAnimeData.title);
      
      // Search for TMDB ID using the season's title
      const tmdbSearchResult = await findTmdbIdForSeason(searchQuery);
      
      if (tmdbSearchResult?.tmdbId) {
        console.log(`Found TMDB match for "${searchQuery}":`, tmdbSearchResult.tmdbId);
        
        // Fetch episode thumbnails using the new TMDB data
        const thumbnails = await fetchEpisodeThumbnails(
          episodes.length,
          tmdbSearchResult.seasonNumber || seasonNumber,
          searchQuery
        );

        if (thumbnails) {
          console.log('Successfully fetched thumbnails for new season:', thumbnails.length);
          const thumbnailsMap = {};
          thumbnails.forEach(thumb => {
            if (thumb.thumbnail) {
              thumbnailsMap[thumb.episode_no] = {
                thumbnail: thumb.thumbnail,
                name: thumb.name,
                description: thumb.description,
                tmdbId: tmdbSearchResult.tmdbId
              };
            }
          });
          setEpisodeThumbnails(thumbnailsMap);
          thumbnailsLoaded.current = true;
        } else {
          console.log('No thumbnails found for new season');
        }
      } else {
        console.log('No TMDB match found for new season');
      }
    } catch (error) {
      console.error('Error fetching season-specific TMDB data:', error);
    }
  };

  const handleServerClick = (sourceId, language) => {
    const source = animeSources.find(src => src.id === sourceId);
    if (source) {
      setCurrentSource(source);
      setCurrentLanguage(language);
    }
  };

  const handleEpisodeClick = (episode) => {
    setCurrentEpisode(episode);
  };

  const getIframeSrc = () => {
    if (!currentEpisode || !animeData) return 'about:blank';
    
    const animeDataWithSeason = {
      ...animeData,
      season: animeData.seasons && animeData.seasons.length > 0 
        ? extractSeasonNumber(animeData.seasons[0].name) 
        : '1'
    };
    
    return getSourceUrl(currentSource.id, currentLanguage, currentEpisode, animeDataWithSeason);
  };

  const renderSeasonOptions = (seasons) => {
    if (!seasons || seasons.length === 0) {
      return <option value="">No seasons available</option>;
    }
    
    return seasons.map((season, index) => (
      <option key={index} value={season.route}>
        {season.name}
      </option>
    ));
  };

  const SkeletonEpisode = () => (
    <div className="bg-anime-card-bg border border-anime-border/10 rounded-lg p-4 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-20 h-12 bg-gray-600 rounded"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-600 rounded w-32"></div>
        </div>
      </div>
    </div>
  );

  const renderEpisodesList = (episodes) => {
    if (episodesLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonEpisode key={index} />
          ))}
        </div>
      );
    }

    if (!episodes || episodes.length === 0) {
      return (
        <div className="text-center py-10 text-gray-400">
          No episodes available
        </div>
      );
    }

    return episodes.map((episode, index) => {
      const episodeNumber = parseInt(episode.episode_no);
      const thumbnailData = episodeThumbnails[episodeNumber];
      const thumbnail = thumbnailData?.thumbnail || 
                       episode.thumbnail || 
                       'https://placehold.co/320x180/141414/fff/?text=Episode&font=poppins';

      return (
        <div
          key={episode.episodeid || index}
          onClick={() => handleEpisodeClick(episode)}
          className={`EP_ITEM bg-anime-card-bg border border-anime-border/10 rounded-xl xl:*:overflow-hidden hover:bg-anime-card-hover hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease cursor-pointer ${
            currentEpisode?.episodeid === episode.episodeid ? 'border-anime-border/15 !bg-anime-border/10 border-1' : ''
          }`}
          data-episode-id={episode.id}
          data-epid={episode.epid}
          data-episode-no={episode.episode_no}
          data-episodeid={episode.episodeid}
          data-tmdbid={thumbnailData?.tmdbId || ''}
          data-description={thumbnailData?.description || ''}
          style={{ opacity: 1, transform: 'translateY(0px)' }}
        >
          <div className="flex flex-col xl:flex-row">
            <div className="aspect-video p-2 pr-0 w-80">
              <img
                src={thumbnail}
                alt={thumbnailData?.name || episode.title || episode.japanese_title || `Episode ${episode.episode_no}`}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/320x180/141414/fff/?text=Episode&font=poppins';
                }}
              />
            </div>
            <div className="w-2/3 p-3 pr-0 flex flex-col gap-1 justify-center">
              <h3 className="font-medium line-clamp-2">
                {thumbnailData?.name || episode.title || episode.japanese_title || `Episode ${episode.episode_no}`}
                {episode.filler && (
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-600 text-white rounded-full">
                    Filler
                  </span>
                )}
              </h3>
              {thumbnailData?.description && (
                <p className="text-sm text-white/70 line-clamp-3 leading-tight">
                  {thumbnailData.description}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <div className="text-white">Loading anime details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen w-full flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">Failed to load anime details</h2>
        <p className="text-white/80">{error}</p>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-anime-card-bg border border-anime-border/10 rounded-lg text-white hover:bg-anime-card-hover transition duration-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!animeData) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <div className="text-white">No anime data found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <AnimeHeader />
      {showModal && (
        <AnimeDetailsModal 
          animeData={animeData} 
          onClose={() => setShowModal(false)} 
        />
      )}
      
      <div className="flex flex-col xl:flex-row gap-4 w-full h-screen pt-20 p-4">
        <div className="w-full h-full flex flex-col gap-4">
          {/* Video Player */}
          <div className="w-full h-full">
            <iframe 
              className="w-full h-[40rem] xl:h-full rounded-xl border border-anime-border/10" 
              src={getIframeSrc()}
              allowFullScreen
            />
          </div>
          
          <div className="w-full">
            <div className="h-full flex flex-row gap-4">
              {/* Anime Info */}
              <div className="bg-anime-modal-bg border border-anime-border/10 rounded-xl w-full h-full p-6 flex flex-col justify-between gap-2">
                <h2 className="text-3xl font-bold">{animeData.title}</h2>
                <p className="text-white/80 overflow-hidden line-clamp-3 text-ellipsis mb-2">
                  {animeData.animeInfo?.Overview || 'No description available'}
                </p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="w-full py-2 bg-anime-card-bg border border-anime-border/10 rounded-lg text-center cursor-pointer hover:bg-anime-card-hover transition duration-200"
                >
                  More info
                </button>
              </div>
              
              {/* Servers */}
              <div className="w-[45rem] bg-anime-modal-bg border border-anime-border/10 rounded-xl h-full p-4 overflow-y-auto">
                <div className="flex flex-col gap-2">
                  {/* SUB Section */}
                  <div className="flex items-center w-full">
                    <div className="flex-grow h-px bg-anime-border/10"></div>
                    <span className="px-2 text-sm text-anime-border/50">SUB</span>
                    <div className="flex-grow h-px bg-anime-border/10"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {animeSources.map((source) => (
                      <button
                        key={`${source.id}-sub`}
                        onClick={() => handleServerClick(source.id, 'sub')}
                        className={`${
                          source.id === currentSource.id && currentLanguage === 'sub' 
                            ? '!bg-white text-anime-card-bg' 
                            : 'bg-anime-card-bg'
                        } border border-anime-border/10 rounded-lg px-2 py-1 text-center text-sm cursor-pointer hover:bg-anime-card-hover transition duration-200 active:scale-90`}
                      >
                        {source.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* DUB Section */}
                  <div className="flex items-center w-full mt-2">
                    <div className="flex-grow h-px bg-anime-border/10"></div>
                    <span className="px-2 text-sm text-anime-border/50">DUB</span>
                    <div className="flex-grow h-px bg-anime-border/10"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {animeSources.map((source) => (
                      <button
                        key={`${source.id}-dub`}
                        onClick={() => handleServerClick(source.id, 'dub')}
                        className={`${
                          source.id === currentSource.id && currentLanguage === 'dub' 
                            ? '!bg-white text-anime-card-bg' 
                            : 'bg-anime-card-bg'
                        } border border-anime-border/10 rounded-lg px-2 py-1 text-center text-sm cursor-pointer hover:bg-anime-card-hover transition duration-200 active:scale-90`}
                      >
                        {source.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Episodes Sidebar */}
        <div className="bg-anime-modal-bg w-full xl:w-[45rem] h-full rounded-xl border border-anime-border/10 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Episodes</h2>
            {animeData.seasons && animeData.seasons.length > 1 && (
              <div className="relative">
                <select 
                  className="appearance-none bg-anime-card-bg border border-anime-border/10 rounded-lg px-4 py-2 pr-8 text-white cursor-pointer outline-none hover:bg-anime-card-hover transition duration-200"
                  defaultValue=""
                  onChange={(e) => handleSeasonChange(e.target.value)}
                >
                  {renderSeasonOptions(animeData.seasons)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {renderEpisodesList(episodesData?.episodes || [])}
          </div>
        </div>
      </div>
    </div>
  );
}
