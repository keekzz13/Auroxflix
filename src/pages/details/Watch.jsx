import React, { useState, useEffect, useRef } from 'react';
import { X, Tv, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSource } from './Sources.jsx';
import { initializeSourceTracking } from '../../components/progress/index.jsx';
import { fetchTmdb, isMobileDevice, isPhone } from '../../utils.jsx';
import MobileOrientationPrompt from './MobileOrientationPrompt.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

const Watch = ({ isOpen, onClose, onUpdateUrl, mediaType, tmdbId, season = 1, episode = 1, title, episodes = [], seasons = [], selectedSeason = null, isTrailerMode = false, trailerData = null }) => {
  const [currentSource, setCurrentSource] = useState('Resident');
  const [currentEpisode, setCurrentEpisode] = useState(episode);
  const [currentSeason, setCurrentSeason] = useState(season);
  const [currentSeasonDetails, setCurrentSeasonDetails] = useState(null);
  const [id, setId] = useState(tmdbId);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showOrientationPrompt, setShowOrientationPrompt] = useState(false);
  const [useMobileLayout, setUseMobileLayout] = useState(false);
  const [showAdDisclaimer, setShowAdDisclaimer] = useState(true);
  const [isAdDisclaimerCollapsed, setIsAdDisclaimerCollapsed] = useState(() => {
    return localStorage.getItem('adDisclaimerCollapsed') === 'true';
  });

  const iframeRef = useRef(null);
  const cleanupRef = useRef(null);
  
  const sources = [
    'Resident',
    'Videasy',
    'VidLink',
    'VidFast',
    'VidsrcXYZ',
    'VidsrcSU',
  ];

  const sourceHasAds = (source) => {
    const sourcesWithAds = ['VidLink', 'VidsrcXYZ', 'VidFast', 'VidsrcSU'];
    return sourcesWithAds.includes(source);
  };

  // For sandbox rules
  const getIframeSandbox = () => {
    if (currentSource === "Videasy") {
      // 🚫 Videasy does not support sandbox, disable it
      return null;
    }
    return "allow-same-origin allow-scripts allow-forms allow-presentation";
  };

  const currentUrl = isTrailerMode && trailerData 
    ? `https://www.youtube.com/embed/${trailerData.key}?autoplay=1&rel=0&modestbranding=1`
    : getSource(currentSource, mediaType, id, currentSeason, currentEpisode);

  useEffect(() => {
    const checkMobileAndOrientation = () => {      
      const landscape = window.innerWidth > window.innerHeight;
      setIsMobile(isMobileDevice());
      setIsLandscape(landscape);
      
      if (isPhone() && !landscape && isOpen && !useMobileLayout) { setShowOrientationPrompt(true); }
      if (isMobileDevice()) { setUseMobileLayout(true); }
    };

    checkMobileAndOrientation();
    window.addEventListener('resize', checkMobileAndOrientation);
    window.addEventListener('orientationchange', checkMobileAndOrientation);

    return () => {
      window.removeEventListener('resize', checkMobileAndOrientation);
      window.removeEventListener('orientationchange', checkMobileAndOrientation);
    };
  }, [isOpen, useMobileLayout]);

  useEffect(() => {
    if (!isOpen) {
      setUseMobileLayout(false);
      setShowOrientationPrompt(false);
    }
  }, [isOpen]);

  // Update state when props change
  useEffect(() => {
    setCurrentEpisode(episode);
    setCurrentSeason(season);
    setId(tmdbId);
    setCurrentTitle(title);
  }, [episode, season, tmdbId, title]);

  // Fetch season details when season changes
  useEffect(() => {
    const fetchSeasonDetails = async () => {
      if (mediaType === 'tv' && currentSeason && id) {
        try {
          const seasonData = await fetchTmdb(`/tv/${id}/season/${currentSeason}`);
          setCurrentSeasonDetails(seasonData);
          
          const episodeData = seasonData.episodes?.find(ep => ep.episode_number === currentEpisode);
          if (episodeData) { setCurrentTitle(episodeData.name || title); }
        } catch (error) {
          console.error('Error fetching season details:', error);
        }
      }
    };

    fetchSeasonDetails();
  }, [currentSeason, id, mediaType, currentEpisode, title]);

  const goToPreviousEpisode = async () => {
    if (mediaType !== 'tv' || !currentSeasonDetails) return;
    
    if (currentEpisode > 1) {
      const newEpisode = currentEpisode - 1;
      const episodeData = currentSeasonDetails.episodes?.find(ep => ep.episode_number === newEpisode);
      setCurrentEpisode(newEpisode);
      setCurrentTitle(episodeData?.name || `Episode ${newEpisode}`);
      onUpdateUrl?.(currentSeason, newEpisode);
    } else {
      const availableSeasons = seasons.filter(s => s.season_number > 0).sort((a, b) => a.season_number - b.season_number);
      const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === currentSeason);
      
      if (currentSeasonIndex > 0) {
        const previousSeason = availableSeasons[currentSeasonIndex - 1];
        try {
          const previousSeasonData = await fetchTmdb(`/tv/${id}/season/${previousSeason.season_number}`);
          const lastEpisode = previousSeasonData.episodes?.length || 1;
          const lastEpisodeData = previousSeasonData.episodes?.find(ep => ep.episode_number === lastEpisode);
          
          setCurrentSeason(previousSeason.season_number);
          setCurrentEpisode(lastEpisode);
          setCurrentTitle(lastEpisodeData?.name || `Episode ${lastEpisode}`);
          setCurrentSeasonDetails(previousSeasonData);
          onUpdateUrl?.(previousSeason.season_number, lastEpisode);
        } catch (error) {
          console.error('Error fetching previous season:', error);
        }
      }
    }
  };

  const goToNextEpisode = async () => {
    if (mediaType !== 'tv' || !currentSeasonDetails) return;
    
    const maxEpisode = currentSeasonDetails.episodes?.length || 0;
    if (currentEpisode < maxEpisode) {
      const newEpisode = currentEpisode + 1;
      const episodeData = currentSeasonDetails.episodes?.find(ep => ep.episode_number === newEpisode);
      setCurrentEpisode(newEpisode);
      setCurrentTitle(episodeData?.name || `Episode ${newEpisode}`);
      onUpdateUrl?.(currentSeason, newEpisode);
    } else {
      const availableSeasons = seasons.filter(s => s.season_number > 0).sort((a, b) => a.season_number - b.season_number);
      const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === currentSeason);
      
      if (currentSeasonIndex < availableSeasons.length - 1) {
        const nextSeason = availableSeasons[currentSeasonIndex + 1];
        try {
          const nextSeasonData = await fetchTmdb(`/tv/${id}/season/${nextSeason.season_number}`);
          const firstEpisodeData = nextSeasonData.episodes?.find(ep => ep.episode_number === 1);
          
          setCurrentSeason(nextSeason.season_number);
          setCurrentEpisode(1);
          setCurrentTitle(firstEpisodeData?.name || 'Episode 1');
          setCurrentSeasonDetails(nextSeasonData);
          onUpdateUrl?.(nextSeason.season_number, 1);
        } catch (error) {
          console.error('Error fetching next season:', error);
        }
      }
    }
  };

  const canGoToPrevious = () => {
    if (mediaType !== 'tv') return false;
    if (currentEpisode > 1) return true;
    const availableSeasons = seasons.filter(s => s.season_number > 0).sort((a, b) => a.season_number - b.season_number);
    const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === currentSeason);
    return currentSeasonIndex > 0;
  };

  const canGoToNext = () => {
    if (mediaType !== 'tv' || !currentSeasonDetails) return false;
    const maxEpisode = currentSeasonDetails.episodes?.length || 0;
    if (currentEpisode < maxEpisode) return true;
    const availableSeasons = seasons.filter(s => s.season_number > 0).sort((a, b) => a.season_number - b.season_number);
    const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === currentSeason);
    return currentSeasonIndex < availableSeasons.length - 1;
  };

  const handleSourceChange = (source) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    setCurrentSource(source);
    
    if (iframeRef.current) {
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          const newUrl = getSource(source, mediaType, id, currentSeason, currentEpisode);
          iframeRef.current.src = newUrl;
        }
      }, 100);
    }
  };
  
  useEffect(() => {
    if (iframeRef.current && currentSource) {
      const sourceIndex = sources.indexOf(currentSource);
      cleanupRef.current = initializeSourceTracking(
        iframeRef.current,
        currentSource,
        id,
        mediaType,
        currentSeason,
        currentEpisode,
        sourceIndex
      );
    }
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [currentSource, id, mediaType, currentSeason, currentEpisode]);
  
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  if (!isOpen) return null;

  if (showOrientationPrompt && isMobile && !isLandscape) {
    return (
      <MobileOrientationPrompt 
        onContinue={() => setShowOrientationPrompt(false)}
      />
    );
  }

  // ----------------- MOBILE LAYOUT -----------------
  if (useMobileLayout) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-black/90">
          <div className="flex items-center gap-2 flex-1">
            {!isTrailerMode && mediaType === 'tv' && (
              <button onClick={goToPreviousEpisode} disabled={!canGoToPrevious()}
                className={`p-2 rounded-full transition-colors ${
                  canGoToPrevious() 
                    ? 'text-white hover:bg-white/20 cursor-pointer' 
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            
            <h2 className="text-white text-sm font-medium truncate">
              {isTrailerMode ? (
                trailerData?.name || 'Trailer'
              ) : mediaType === 'tv' ? (
                <span>S{currentSeason}E{currentEpisode} - {currentTitle}</span>
              ) : (currentTitle)}
            </h2>
            
            {!isTrailerMode && mediaType === 'tv' && (
              <button onClick={goToNextEpisode} disabled={!canGoToNext()}
                className={`p-2 rounded-full transition-colors ${
                  canGoToNext() 
                    ? 'text-white hover:bg-white/20 cursor-pointer' 
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isTrailerMode && (
              <DropdownMenu>
                <DropdownMenuTrigger className="bg-zinc-900 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors cursor-pointer">
                  <Tv className="w-4 h-4" />
                  <span className="text-sm">{currentSource}</span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg z-50 min-w-[150px]">
                  {sources.map((source) => (
                    <DropdownMenuItem key={source} onClick={() => handleSourceChange(source)}
                      className={`px-4 py-2 text-white hover:bg-white/10 transition-colors ${
                        currentSource === source ? 'bg-white/20' : ''
                      }`}
                    >
                      {source}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button onClick={onClose} className="bg-zinc-900 text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1">
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={currentSource}
            {...(getIframeSandbox() ? { sandbox: getIframeSandbox() } : {})}
          />
        </div>
      </div>
    );
  }

  // ----------------- DESKTOP LAYOUT -----------------
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#131315] border border-white/20 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-center p-2 relative">
          <div className="flex items-center gap-3">
             {!isTrailerMode && mediaType === 'tv' && (
               <button
                 onClick={goToPreviousEpisode}
                 disabled={!canGoToPrevious()}
                 className={`p-2 rounded-full transition-colors ${
                   canGoToPrevious() 
                     ? 'text-white hover:bg-white/20 cursor-pointer' 
                     : 'text-gray-500 cursor-not-allowed'
                 }`}
               >
                 <ChevronLeft className="w-6 h-6" />
               </button>
             )}
            
            <h2 className="text-white text-lg font-medium">
              {isTrailerMode ? (
                trailerData?.name || 'Trailer'
              ) : mediaType === 'tv' ? (
                <span>
                  S{currentSeason}E{currentEpisode} - {currentTitle}
                </span>
              ) : (
                currentTitle
              )}
            </h2>
            
             {!isTrailerMode && mediaType === 'tv' && (
               <button
                 onClick={goToNextEpisode}
                 disabled={!canGoToNext()}
                 className={`p-2 rounded-full transition-colors ${
                   canGoToNext() 
                     ? 'text-white hover:bg-white/20 cursor-pointer' 
                     : 'text-gray-500 cursor-not-allowed'
                 }`}
               >
                 <ChevronRight className="w-6 h-6" />
               </button>
             )}
          </div>
          
          <div className="absolute -top-4 -right-4 flex items-center gap-2">
            {!isTrailerMode && (
              <DropdownMenu>
                <DropdownMenuTrigger className="bg-zinc-900 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-colors border-l border border-white/20 cursor-pointer">
                  <Tv className="w-4 h-4" />
                  <span>{currentSource}</span>
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg z-50 min-w-[150px]">
                  {sources.map((source) => (
                    <DropdownMenuItem
                      key={source}
                      onClick={() => handleSourceChange(source)}
                      className={`px-4 py-2 text-white hover:bg-white/10 transition-colors ${
                        currentSource === source ? 'bg-white/20' : ''
                      }`}
                    >
                      {source}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              onClick={onClose}
              className="bg-zinc-900 text-white p-2.5 rounded-full hover:bg-zinc-800 transition-colors border-l border border-white/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 p-4 pb-3 pt-0">
          <div className="w-full rounded-xl overflow-hidden aspect-video relative">
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={currentSource}
              {...(getIframeSandbox() ? { sandbox: getIframeSandbox() } : {})}
            />
            
            {/* Ad Blocker Disclaimer Overlay */}
            {!isTrailerMode && showAdDisclaimer && sourceHasAds(currentSource) && (
              <div className="absolute top-2 right-2 z-10">
                {isAdDisclaimerCollapsed ? (
                  <button
                    onClick={() => {
                      setIsAdDisclaimerCollapsed(false);
                      localStorage.setItem('adDisclaimerCollapsed', 'false');
                    }}
                    className="bg-black/80 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-black/90 transition-colors border border-white/20"
                    title="Show ad disclaimer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 pr-2.5">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1">
                        <span className="text-white text-xs leading-relaxed flex items-center">
                          This source has ads. To fully remove all ads, use{' '}
                          <a 
                            href="https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-black font-semibold bg-white hover:bg-neutral-200 rounded px-1.5 py-0.5 tracking-tight inline-flex items-center gap-1 text-xs ml-1"
                          >
                            <img 
                              src='https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/UBlock_Origin.svg/1200px-UBlock_Origin.svg.png' 
                              className='w-3 h-3'
                              alt="uBlock Origin"
                            />
                            uBlock Origin
                          </a>
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          setIsAdDisclaimerCollapsed(true);
                          localStorage.setItem('adDisclaimerCollapsed', 'true');
                        }}
                        className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                        title="Collapse disclaimer"
                      >
                        <ChevronDown className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
