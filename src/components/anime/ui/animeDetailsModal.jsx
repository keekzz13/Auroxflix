import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addToWatchlist, removeFromWatchlist, isInWatchlist, toggleWatchlist } from '../../../utils.jsx';

export default function AnimeDetailsModal({ animeData, onClose }) {
  const [showFullOverview, setShowFullOverview] = useState(false);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  if (!animeData) return null;

  const {
    id,
    title,
    japanese_title,
    poster,
    backdrop_image,
    animeInfo,
    seasons,
    recommended_data,
    related_data,
    anilistId,
    malId
  } = animeData;

  const handleWatchlistClick = () => {
    toggleWatchlist(animeData);
  };

  const inWatchlist = isInWatchlist(id);

  const infoFields = [
    { key: 'Genres', label: 'Genres' },
    { key: 'Status', label: 'Status' },
    { key: 'Studios', label: 'Studios' },
    { key: 'Producers', label: 'Producers' },
    { key: 'Released', label: 'Released' },
    { key: 'Type', label: 'Type' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-anime-modal-bg border border-anime-border/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 transform transition-all duration-300 ease-in-out scale-100 opacity-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title || 'Anime Details'}</h2>
          <button 
            onClick={onClose}
            className="p-2 bg-anime-card-bg border border-anime-border/10 rounded-lg hover:bg-anime-card-hover transition duration-200 active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 flex flex-col gap-3">
              <img 
                src={poster || ''} 
                alt={title} 
                className="w-full rounded-lg border border-anime-border/10"
              />
              
              <div className="flex flex-col gap-2">                
                <div className="flex gap-2">
                  {anilistId && (
                    <a 
                      href={`https://anilist.co/anime/${anilistId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center h-10 px-4 bg-[#18212C] border border-anime-border/10 rounded-lg hover:bg-[#202b39] transition duration-200 text-center"
                    >
                      <svg fill="#01ABFF" strokeWidth="0" role="img" viewBox="0 0 24 24" height="1.4rem" width="1.4rem" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z"></path>
                      </svg>
                    </a>
                  )}
                  {malId && (
                    <a 
                      href={`https://myanimelist.net/anime/${malId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center px-4 h-10 bg-[#2E51A2] border border-anime-border/10 rounded-lg hover:bg-[#3963c5] transition duration-200 text-center"
                    >
                      <svg fill="#fff" strokeWidth="0" role="img" viewBox="0 7 24 9" height="1rem" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.273 7.247v8.423l-2.103-.003v-5.216l-2.03 2.404-1.989-2.458-.02 5.285H.001L0 7.247h2.203l1.865 2.545 2.015-2.546 2.19.001zm8.628 2.069l.025 6.335h-2.365l-.008-2.871h-2.8c.07.499.21 1.266.417 1.779.155.381.298.751.583 1.128l-1.705 1.125c-.349-.636-.622-1.337-.878-2.082a9.296 9.296 0 0 1-.507-2.179c-.085-.75-.097-1.471.107-2.212a3.908 3.908 0 0 1 1.161-1.866c.313-.293.749-.5 1.1-.687.351-.187.743-.264 1.107-.359a7.405 7.405 0 0 1 1.191-.183c.398-.034 1.107-.066 2.39-.028l.545 1.749H14.51c-.593.008-.878.001-1.341.209a2.236 2.236 0 0 0-1.278 1.92l2.663.033.038-1.81h2.309zm3.992-2.099v6.627l3.107.032-.43 1.775h-4.807V7.187l2.13.03z"></path>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-bold">{title || 'Unknown Title'}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {animeInfo?.Overview && (
                  <div className="col-span-1 md:col-span-2">
                    <div className="relative">
                      <p 
                        className={`text-white/80 overflow-hidden text-ellipsis ${
                          showFullOverview ? '' : 'line-clamp-4'
                        }`}
                      >
                        {animeInfo.Overview}
                      </p>
                      <button 
                        onClick={() => setShowFullOverview(!showFullOverview)}
                        className="text-blue-400 hover:text-blue-300 transition duration-200 mt-1"
                      >
                        {showFullOverview ? 'Show less' : 'Show more'}
                      </button>
                    </div>
                  </div>
                )}
                
                {animeInfo && infoFields.map(({ key, label }) => {
                  if (!animeInfo[key]) return null;
                  
                  const value = Array.isArray(animeInfo[key]) 
                    ? animeInfo[key].join(', ') 
                    : animeInfo[key];
                  
                  return (
                    <div key={key}>
                      <h4 className="font-semibold mb-1">{label}</h4>
                      <p className="text-white/80">{value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {seasons && seasons.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-3">Seasons</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {seasons.map((season, index) => (
                  <Link 
                    key={index}
                    to={`/anime/${season.route}`} 
                    className="relative bg-anime-card-bg border border-anime-border/10 rounded-lg p-4 py-5 hover:bg-anime-card-hover transition duration-200 overflow-hidden"
                  >
                    {season.background && (
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={season.background} 
                          alt="" 
                          className="w-full h-full object-cover opacity-30"
                        />
                      </div>
                    )}
                    <div className="relative z-10 flex items-center justify-center">
                      <h4 className="font-medium text-lg">{season.name}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {related_data && related_data.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-3">Related Anime</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {related_data.slice(0, 6).map((anime, index) => (
                  <Link 
                    key={index}
                    to={`/anime/${anime.id}`} 
                    className="bg-anime-card-bg border border-anime-border/10 rounded-lg p-4 hover:bg-anime-card-hover transition duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-24 rounded overflow-hidden">
                        <img 
                          src={anime.poster} 
                          alt={anime.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold">{anime.title}</h4>
                        <p className="text-sm text-white/70">{anime.tvInfo?.showType || ''}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {recommended_data && recommended_data.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-3">Recommended Anime</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recommended_data.slice(0, 6).map((anime, index) => (
                  <Link 
                    key={index}
                    to={`/anime/${anime.id}`} 
                    className="bg-anime-card-bg border border-anime-border/10 rounded-lg p-4 hover:bg-anime-card-hover transition duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-24 rounded overflow-hidden">
                        <img 
                          src={anime.poster} 
                          alt={anime.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold">{anime.title}</h4>
                        <p className="text-sm text-white/70">{anime.tvInfo?.showType || ''}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
