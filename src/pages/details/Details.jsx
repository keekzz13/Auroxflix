import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { fetchTmdb, getTmdbImage, formatReleaseDate, getContentRating, isInWatchlist, toggleWatchlist } from '../../utils.jsx';
import { Download, Play, ThumbsUp, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import { SpotlightSkeleton, CategorySkeleton } from '../../components/Skeletons.jsx';
import { EpisodeCard, TrailerCard, CastCard, MediaCard, SeasonDropdown } from './Cards.jsx';
import Watch from './Watch.jsx';
import DownloadSection from '../../components/downloadSection.jsx';

const SpotlightSection = ({ item, mediaType, isLoading, onWatchClick, onDownloadClick, firstEpisodeName, showDownloads }) => {
  const [inWatchlist, setInWatchlist] = useState(false);
  
  useEffect(() => {
    if (item && item.id) { setInWatchlist(isInWatchlist(item.id)); }
  }, [item]);
  
  if (isLoading || !item) {
    return <SpotlightSkeleton />;
  }
  
  const backgroundImage = getTmdbImage(item.backdrop_path) || getTmdbImage(item.poster_path);
  const logoImage = item.images?.logos?.find(logo => logo.iso_639_1 === 'en')?.file_path;
  
  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    const isAdded = toggleWatchlist(item);
    setInWatchlist(isAdded);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    toast(`Liked ${item.title || item.name}`);
  };

  return (
    <div id="spotlight" className="relative w-full h-[70vh] bg-cover bg-center bg-no-repeat flex items-end animate-slide-up" style={{backgroundImage: `url('${backgroundImage}')`}}>
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0a]/70 via-black/20 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0a]/80 via-black/40 md:via-black/20 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#090a0a]/80 md:from-[#090a0a]/60 via-[#090a0a]/10 to-transparent"></div>

      {/* Content container */}
      <div className="relative z-10 p-4 md:p-8 pb-0 w-full md:pr-0 md:text-left text-center">
        {logoImage ? (
          <img src={getTmdbImage(logoImage)} className="md:max-h-56 max-w-sm min-w-[13rem] mb-4 animate-fade-in-delayed mx-auto md:mx-0" alt={item.title || item.name} />
        ) : (
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 w-full md:w-[24rem] animate-fade-in-delayed">
            {item.title || item.name}
          </h1>
        )}
        
        {/* Rating and info */}
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
        
        {/* Description */}
        <p className="text-white text-base md:text-lg mb-8 md:mb-16 leading-6 max-w-xl line-clamp-3 overflow-ellipsis animate-fade-in-delayed-3 mx-auto md:mx-0">
          {item.overview}
        </p>
        
        {/* Action buttons */}
        <div className="flex flex-col md:flex-row mb-4 w-full md:justify-between items-center gap-4 animate-fade-in-delayed-4">
          <div className="flex items-center gap-2 justify-center">
            <button 
              onClick={onDownloadClick}
              className="bg-white/15 text-white p-2.5 md:px-4 md:py-2.5 rounded-full hover:bg-white/25 transition-all cursor-pointer flex items-center gap-2"
            >
              {showDownloads ? <Info className="w-6 h-6" /> : <Download className="w-6 h-6" />}
              <span className="hidden md:inline font-normal">
                {showDownloads ? 'Info' : 'Download'}
              </span>
            </button>
            <button 
              onClick={() => onWatchClick({ season: 1, episode: 1, name: mediaType === 'tv' ? firstEpisodeName : (item.title || item.name || '') })}
              className="bg-white text-black px-6 py-2 rounded-full font-semibold text-lg flex items-center gap-2 hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <Play className="w-6 h-6" fill="currentColor" />
              Watch now
            </button>
            <button 
              onClick={handleLikeClick}
              className="bg-white/15 text-white p-2.5 rounded-full hover:bg-white/25 transition-all cursor-pointer"
            >
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
        
        {/* Genre tags */}
        <div className="flex gap-2 text-neutral-600 text-sm mb-3 animate-fade-in-delayed-5 justify-center md:justify-start">
          {
            item.genres?.slice(0, 3).map((genre, index) => (
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

const CategorySection = ({ title, items, isLoading: categoryLoading, renderItem, layout = 'horizontal', headerComponent, episodeCount = 0 }) => {
  const [visibleItems, setVisibleItems] = useState(layout === 'grid' ? (title === 'Episodes' ? items.length : 8) : (title === 'Cast & Crew' ? items.length : 4));
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = React.useRef(null);

  useEffect(() => {
    if (title === 'Episodes' || title === 'Cast & Crew') { setVisibleItems(items.length);
    } else { setVisibleItems(layout === 'grid' ? 8 : 4); }
  }, [items, title, layout]);

  const handleScroll = (e) => {
    const container = e.target;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    if (scrollLeft + clientWidth >= scrollWidth - 200 && !isLoading && visibleItems < items.length) {
      setIsLoading(true);
      setVisibleItems(prev => Math.min(prev + (layout === 'grid' ? 8 : 4), items.length));
      setIsLoading(false);
    }
  };

  const getAnimationDelay = (index) => {
    if (title !== 'Episodes') return index * 100;
    
    const baseDelay = 100;
    const speedMultiplier = Math.max(0.2, 1 - (episodeCount > 25 ? Math.min((episodeCount - 25) / 75, 0.8) : 0));
    return index * (baseDelay * speedMultiplier);
  };

  const displayedItems = items.slice(0, visibleItems);

  if (categoryLoading) { return <CategorySkeleton title={title} episodeCount={episodeCount} />; }
  if (!items.length) { return null; }

  return (
    <div className="mb-8 animate-slide-up">
      <div className="flex justify-between items-center mb-1 items-end">
        <h2 className="text-2xl text-white">{title}</h2>
        {headerComponent}
      </div>
      {layout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-4">
          {displayedItems.map((item, index) => (
            <div key={item.uniqueId || item.id || index} className="animate-stagger" style={{animationDelay: `${getAnimationDelay(index)}ms`}}>
              {renderItem(item, index)}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-white border-solid border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        <div 
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide py-4 pl-4 -ml-4"
          onScroll={handleScroll}
        >
          {displayedItems.map((item, index) => (
            <div key={item.uniqueId || item.id || index} className="animate-stagger" style={{animationDelay: `${getAnimationDelay(index)}ms`}}>
              {renderItem(item, index)}
            </div>
          ))}
          {isLoading && (
            <div className="flex-shrink-0 w-96 h-56 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-solid border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Details = () => {
  const { tmdbId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mediaType = location.pathname.startsWith('/movie') ? 'movie' : 'tv';
  const [detailsItem, setDetailsItem] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [trailers, setTrailers] = useState([]);
  const [cast, setCast] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [watchData, setWatchData] = useState({ season: 1, episode: 1, name: '' });
  const [firstEpisodeName, setFirstEpisodeName] = useState('');
  const [trailerData, setTrailerData] = useState(null);
  
  // Get state from URL parameters
  const showDownloads = searchParams.get('dl') === '1';
  const watchModalOpen = searchParams.get('watch') === '1';
  const trailerModalOpen = searchParams.get('trailer') === '1';
  const urlSeason = parseInt(searchParams.get('season')) || 1;
  const urlEpisode = parseInt(searchParams.get('episode')) || 1;

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch main details
        const detailRoute = `/${mediaType}/${tmdbId}?language=en-US&append_to_response=images,content_ratings,release_dates,videos,credits&include_image_language=en`;
        const details = await fetchTmdb(detailRoute);
        setDetailsItem(details);
        
        // Extract trailers and videos
        const videos = details.videos?.results || [];
        const trailerVideos = videos.filter(video => 
          video.type === 'Trailer' || video.type === 'Teaser'
        ).slice(0, 10);
        setTrailers(trailerVideos);
        
        // Extract cast and crew with unique identifiers
        const castMembers = (details.credits?.cast || []).map(person => ({
          ...person,
          uniqueId: `cast-${person.id}`,
          role: 'cast'
        }));
        const crewMembers = (details.credits?.crew || []).map(person => ({
          ...person,
          uniqueId: `crew-${person.id}-${person.job}`,
          role: 'crew'
        }));
        setCast([...castMembers, ...crewMembers]);
        
        // Fetch seasons and episodes for TV shows
        if (mediaType === 'tv') {
          setSeasons(details.seasons || []);
          if (details.seasons && details.seasons.length > 0) {
            const firstSeason = details.seasons.find(s => s.season_number > 0) || details.seasons[0];
            setSelectedSeason(firstSeason);
            const episodesData = await fetchTmdb(`/tv/${tmdbId}/season/${firstSeason.season_number}`);
            setEpisodes(episodesData.episodes || []);
            
            // Set the first episode name
            if (episodesData.episodes && episodesData.episodes.length > 0) {
              setFirstEpisodeName(episodesData.episodes[0].name || '');
            }
          }
        }
        
        // Fetch recommendations
        const recommendationsRoute = `/${mediaType}/${tmdbId}/recommendations?language=en-US&page=1`;
        const recommendationsData = await fetchTmdb(recommendationsRoute);
        setRecommendations(recommendationsData.results?.slice(0, 20) || []);
        
      } catch (err) { setError(err.message); console.error('Error loading details data:', err);
      } finally { setIsLoading(false); }
    };

    if (tmdbId && mediaType) {
      loadData();
    }
  }, [tmdbId, mediaType]);

  // Update watchData when URL parameters change
  useEffect(() => {
    if (watchModalOpen && mediaType === 'tv') {
      const currentEpisode = episodes.find(ep => ep.episode_number === urlEpisode);
      setWatchData({
        season: urlSeason,
        episode: urlEpisode,
        name: currentEpisode?.name || `Episode ${urlEpisode}`
      });
    } else if (watchModalOpen && mediaType === 'movie') {
      setWatchData({
        season: 1,
        episode: 1,
        name: detailsItem?.title || detailsItem?.name || ''
      });
    }
  }, [watchModalOpen, urlSeason, urlEpisode, episodes, mediaType, detailsItem]);

  // Handle season change
  const handleSeasonChange = async (season) => {
    setSelectedSeason(season);
    setEpisodesLoading(true);
    try {
      const episodesData = await fetchTmdb(`/tv/${tmdbId}/season/${season.season_number}`);
      setEpisodes(episodesData.episodes || []);
    } catch (error) { console.error('Error fetching episodes:', error); setEpisodes([]);
    } finally { setEpisodesLoading(false); }
  };

  // Handle trailer click
  const handleTrailerClick = (video) => {
    setTrailerData(video);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('trailer', '1');
    setSearchParams(newParams);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-red-500 text-xl">Error: {error}</div></div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0">
      <Header />
      
      <SpotlightSection 
          item={detailsItem} 
          mediaType={mediaType} 
          isLoading={isLoading} 
          firstEpisodeName={firstEpisodeName}
          showDownloads={showDownloads}
          onWatchClick={(data) => {
            setWatchData(data);
            const newParams = new URLSearchParams(searchParams);
            newParams.set('watch', '1');
            newParams.set('season', data.season.toString());
            newParams.set('episode', data.episode.toString());
            setSearchParams(newParams);
          }}
          onDownloadClick={() => {
            const newParams = new URLSearchParams(searchParams);
            if (showDownloads) { newParams.delete('dl');
            } else { newParams.set('dl', '1'); }
            setSearchParams(newParams);
          }}
        />
      
      <div className="px-8 pb-8 pt-6 space-y-8">
        {showDownloads ? (
          <DownloadSection 
            item={detailsItem}
            mediaType={mediaType}
            tmdbId={tmdbId}
          />
        ) : (
          <>
            {/* Episodes Section (TV Shows only) */}
            {mediaType === 'tv' && seasons.length > 0 && (
              <CategorySection 
                title="Episodes" 
                items={episodes} 
                isLoading={episodesLoading} 
                layout="grid" 
                episodeCount={selectedSeason?.episode_count || episodes.length}
                headerComponent={
                  <SeasonDropdown seasons={seasons.filter(s => s.season_number > 0)} selectedSeason={selectedSeason} onSeasonChange={handleSeasonChange} />
                }
                renderItem={(episode) => {
                  const totalEpisodes = selectedSeason?.episode_count || episodes.length;
                  const hideImages = totalEpisodes > 100;
                  
                  return (
                    <div 
                      onClick={() => {
                        const seasonNum = selectedSeason?.season_number || 1;
                        const episodeNum = episode.episode_number;
                        setWatchData({ 
                          season: seasonNum, 
                          episode: episodeNum,
                          name: episode.name || ''
                        });
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('watch', '1');
                        newParams.set('season', seasonNum.toString());
                        newParams.set('episode', episodeNum.toString());
                        setSearchParams(newParams);
                      }}
                      className="cursor-pointer"
                    >
                      <EpisodeCard 
                        episode={episode} 
                        hideImages={hideImages}
                        totalEpisodes={totalEpisodes}
                      />
                    </div>
                  );
                }}
              />
            )}
            
            {/* Trailers & More */}
            <CategorySection title="Trailers & More" items={trailers} isLoading={isLoading} layout="horizontal" renderItem={(video) => (
              <div onClick={() => handleTrailerClick(video)} className="cursor-pointer">
                <TrailerCard video={video} variant="episode" />
              </div>
            )} />
            
            {/* Cast & Crew */}
            {cast.length > 0 && (
              <CategorySection title="Cast & Crew" items={cast} isLoading={isLoading} renderItem={(person) => <CastCard person={person} />} />
            )}
            
            {/* More Like This */}
            <CategorySection title="More Like This" items={recommendations} isLoading={isLoading} renderItem={(item) => <MediaCard item={item} variant="horizontal" />} />
          </>
        )}
      </div>
      
      <Footer />
      
      {/* Watch Modal */}
      <Watch 
        isOpen={watchModalOpen || trailerModalOpen}
        onClose={() => {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('watch');
          newParams.delete('trailer');
          newParams.delete('season');
          newParams.delete('episode');
          setSearchParams(newParams);
        }}
        onUpdateUrl={(season, episode) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set('season', season.toString());
          newParams.set('episode', episode.toString());
          setSearchParams(newParams);
        }}
        mediaType={mediaType}
        tmdbId={tmdbId}
        season={watchData.season}
        episode={watchData.episode}
        title={watchData.name}
        episodes={episodes}
        seasons={seasons}
        selectedSeason={selectedSeason}
        isTrailerMode={trailerModalOpen}
        trailerData={trailerData}
      />
    </div>
  );
};

export default Details;
