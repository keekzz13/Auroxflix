import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { fetchTmdb } from '../utils.jsx';

const QuickSearch = ({ isOpen: externalIsOpen, onOpenChange }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (location.pathname.startsWith('/anime')) {
        return;
      }
      
      // Open spotlight with Ctrl+G / Cmd+G
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setIsOpen(true);
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
      }
      
      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, location.pathname, setIsOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      if (inputRef.current) {
        setTimeout(() => inputRef.current.focus(), 100);
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => { document.body.style.overflow = 'unset' };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async (query) => {
    if (!query.trim()) return;

    try {
      setIsLoading(true);
      setShowResults(false);
      const searchRoute = `/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1`;
      const data = await fetchTmdb(searchRoute);
      
      // filter out people and, limit to 20 results
      const filteredResults = data.results
        .filter(item => 
          (item.media_type === 'movie' || item.media_type === 'tv') &&
          item.vote_average > 0.0 &&
          item.vote_count >= 3
        )
        .slice(0, 20);
      
      setSearchResults(filteredResults);
      
      // Trigger animation
      if (filteredResults.length > 0) {
        setTimeout(() => setShowResults(true), 50);
      }
    } catch (err) {
      console.error('Error searching:', err);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = (item) => {
    const path = item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
    navigate(path);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) { handleClose(); }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm"
      onClick={handleBackgroundClick}
    >
      <div className="w-full max-w-3xl mx-4">
        <div className="mb-4">
          <div className="bg-white/10 border border-white/20 rounded-full px-4 py-2 mx-2 flex items-center gap-2 shadow-lg">
            <SearchIcon className="w-4 h-4 text-white" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies and TV shows..."
              className="flex-1 bg-transparent text-white text-sm font-medium placeholder-white/60 focus:outline-none"
            />
            <button
              onClick={handleClose}
              className="p-1 text-white/60 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {(searchResults.length > 0 || (searchQuery.trim() && !isLoading)) && (
          <div ref={resultsRef} className="overflow-y-auto space-y-2 rounded-xl p-2" style={{ maxHeight: 'calc(100vh - 550px)' }}>
            {searchResults.length > 0 ? (
              searchResults.map((item, index) => (
                <div key={item.id} onClick={() => handleItemClick(item)}
                  className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-200 ease-out shadow-lg hover:brightness-125 hover:scale-[1.015] ${
                    showResults 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-4 scale-95'
                  }`}
                  style={{
                    backgroundImage: item.backdrop_path 
                      ? `linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%), url(https://image.tmdb.org/t/p/w780${item.backdrop_path})`
                      : item.poster_path
                        ? `linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%), url(https://image.tmdb.org/t/p/w780${item.poster_path})`
                        : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    transitionDelay: showResults ? `${index * 50}ms` : '0ms'
                  }}
                >
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 h-32 overflow-hidden rotate-3 shadow-xl z-20">
                    <img
                      src={
                        item.poster_path
                          ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
                          : `https://placehold.co/185x278/141414/fff/?text=${encodeURIComponent(item.title || item.name || 'Unknown')}&font=poppins`
                      }
                      alt={item.title || item.name}
                      className="w-full h-full object-cover transform scale-110"
                    />
                  </div>
                  
                  <div className="relative z-10 bg-black/30 backdrop-blur-sm px-5 py-4 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-20 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-base truncate drop-shadow-sm">
                          {item.title || item.name}
                        </h3>
                        <p className="text-white/70 text-sm font-medium">
                          {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                          {item.release_date || item.first_air_date ? (
                            <span className="ml-2 text-white/60">
                              {new Date(item.release_date || item.first_air_date).getFullYear()}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-white/50 text-sm mt-1 line-clamp-2 min-h-[2.5em] drop-shadow-sm">
                          {item.overview 
                            ? item.overview
                            : 'No description'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : searchQuery.trim() ? (
              <div className={`bg-white/10 border border-white/20 rounded-xl px-5 py-5 transition-all duration-200 ease-out ${
                !isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                <div className="flex items-center justify-center">
                  <p className="text-white/60 text-base font-medium">No results found</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickSearch;
