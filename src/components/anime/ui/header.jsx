import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bookmark,
  Home,
  Tv,
  Film,
  Cat,
  MoreHorizontal,
} from 'lucide-react';
import { searchAnime } from '../search.jsx';

// Define core navigation items specific to the Anime section. The first three will be
// displayed directly in the mobile nav bar; any additional items (including header
// icons and optional install link) will be tucked into a "More" menu.
const navItems = [
  { to: '/', label: 'Home', icon: Home, type: 'nav' },
  { to: '/movies', label: 'Movies', icon: Film, type: 'nav' },
  { to: '/tv', label: 'TV Shows', icon: Tv, type: 'nav' },
  { to: '/anime', label: 'Anime', icon: Cat, type: 'nav' },
];

// Header icons such as search and watchlist behave like nav items but are styled
// differently when shown directly. These will be merged into the nav list below.
const headerIcons = [
  { to: '/search', label: 'Search', icon: Search, type: 'icon' },
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark, type: 'icon' },
];

// Component for the iOS install icon. Keeps JSX below cleaner.
const InstallIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

export default function AnimeHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(true);

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // References for both the dropdown menu and the More button itself. We use these
  // to detect clicks outside and close the menu accordingly. Without tracking the
  // button, the menu will close immediately upon opening because the click event
  // propagates to the document handler before the menu is mounted.
  const moreMenuRef = useRef(null);
  const moreButtonRef = useRef(null);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Detect iOS PWA install status for optional install link
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || navigator.vendor || '');
  const isPWA = window.navigator.standalone;
  const showIOSInstall = isIOS && !isPWA;

  // Merge nav items, header icons, and optional install item into a single list.
  // Only the first three will be visible by default; the rest appear in the More menu.
  const combinedNavItems = [
    ...navItems,
    ...headerIcons,
    ...(showIOSInstall
      ? [
          {
            to: '/ios',
            label: 'Install',
            icon: InstallIcon,
            type: 'install',
          },
        ]
      : []),
  ];

  const visibleItems = combinedNavItems.slice(0, 3);
  const moreItems = combinedNavItems.slice(3);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close search dropdown if clicked outside search-related elements
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
      // Close the More menu if clicked outside both the menu and the More button
      if (
        showMoreMenu &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target)
      ) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = async (query, page = 1, resetResults = false) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowDropdown(true);

    try {
      const { results, totalPages: newTotalPages } = await searchAnime(query, page);

      setCurrentPage(page);
      setTotalPages(newTotalPages);
      setHasMoreResults(page < newTotalPages);

      if (resetResults) {
        setSearchResults(results);
      } else {
        setSearchResults((prev) => [...prev, ...results]);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      if (resetResults) {
        setSearchResults([]);
      }
      setHasMoreResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      handleSearch(value, 1, true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch(searchQuery, 1, true);
    }
  };

  const handleAnimeClick = (animeId) => {
    navigate(`/anime/${animeId}`);
    setShowDropdown(false);
  };

  const loadMoreResults = () => {
    if (!isLoading && hasMoreResults && currentPage < totalPages) {
      handleSearch(searchQuery, currentPage + 1, false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      loadMoreResults();
    }
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="h-16 fixed top-0 left-0 bg-anime-modal-bg border-b border-anime-border/10 transition-all duration-200 z-50 py-3 px-4 text-white items-center text-md flex-row justify-between hidden md:flex w-full">
        <div className="flex items-center">
          <div className="text-2xl" style={{ fontFamily: 'Instrument Serif' }}>
            <Link to="/" className="hover:text-blue-400 transition duration-200 active:scale-90">
              NepoFlix
            </Link>
            <Link to="/anime" className="hover:text-pink-400 transition duration-200 active:scale-90">
              {" "}Anime
            </Link>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center pl-6 pr-2">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400 group-focus-within:text-blue-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search anime"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              className="block w-full bg-anime-card-bg border border-anime-border/10 rounded-md py-2 pl-10 pr-3 text-sm placeholder-anime-border/20 text-white focus:outline-none focus:border-blue-400 focus:placeholder-blue-400/40 transition duration-200 ease-in-out"
            />

            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-anime-modal-bg border border-anime-border/10 rounded-md shadow-xl overflow-hidden z-50 max-h-[80vh] overflow-y-auto"
                onScroll={handleScroll}
              >
                <div className="min-h-[100px]">
                  {isLoading && searchResults.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <p className="text-white opacity-60">Loading...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      {searchResults.map((anime, index) => (
                        <div
                          key={`${anime.id}-${index}`}
                          onClick={() => handleAnimeClick(anime.id)}
                          className="anime-card flex items-center p-3 hover:bg-anime-card-hover cursor-pointer transition duration-200"
                          data-id={anime.id}
                        >
                          <img
                            src={
                              anime.poster ||
                              'https://placehold.co/60x80/141414/fff/?text=No+Image&font=poppins'
                            }
                            alt={anime.title}
                            className="w-12 h-16 object-cover rounded mr-3"
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm line-clamp-1">
                              {anime.title}
                            </h4>
                            <p className="text-gray-400 text-xs line-clamp-2">
                              {anime.japanese_title ||
                                anime.description ||
                                'No description available'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex items-center justify-center p-4">
                          <p className="text-white opacity-60">Loading more...</p>
                        </div>
                      )}
                    </div>
                  ) : searchQuery.trim() ? (
                    <div className="flex items-center justify-center p-8">
                      <p className="text-white opacity-60">No results found</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <p className="text-white opacity-60">Enter your search query above</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center flex-row gap-2">
          {/* Keep watchlist icon separate in desktop header. It uses the existing handler */}
          <button
            aria-label="Watchlist"
            onClick={() => alert('not coded yet. coming soon')}
            className="p-2 w-10 h-10 bg-anime-card-bg border border-anime-border/10 rounded-md hover:bg-[#1f1f1f] cursor-pointer active:scale-90 focus:outline-none focus:border-blue-400 focus:text-blue-400 flex justify-center items-center"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Nav Bar */}
      <nav className="fixed bottom-[-1px] left-0 w-full flex justify-around items-center py-3 bg-[#232323ab] backdrop-blur-lg text-white md:hidden z-50">
        {/* Show only the first three items directly */}
        {visibleItems.map(({ to, label, icon: Icon }, idx) => (
          <NavLink
            key={idx}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs transition-colors ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
              }`
            }
            aria-label={label}
            aria-current={location.pathname === to ? 'page' : undefined}
          >
            {Icon && <Icon className="w-6 h-6" />}
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}

        {/* More button for remaining items */}
        {moreItems.length > 0 && (
          <div className="relative">
            <button
              ref={moreButtonRef}
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className="flex flex-col items-center text-zinc-400 hover:text-white transition-colors"
              aria-label="More"
            >
              <MoreHorizontal className="w-6 h-6" />
              <span className="mt-1 text-xs">More</span>
            </button>
            {showMoreMenu && (
              <div
                ref={moreMenuRef}
                className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-[#232323ab] backdrop-blur-lg rounded-lg shadow-lg py-2 px-4 z-50 min-w-[200px]"
              >
                {moreItems.map(({ to, label, icon: Icon }, idx) => (
                  <NavLink
                    key={idx}
                    to={to}
                    end={to === '/'}
                    onClick={() => setShowMoreMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 py-2 px-4 text-sm transition-colors ${
                        isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                      }`
                    }
                    aria-label={label}
                    aria-current={location.pathname === to ? 'page' : undefined}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}