import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAnime } from '../../components/anime/search.jsx';
import { AnimeCard } from '../../components/anime/ui/card.jsx';
import AnimeHeader from '../../components/anime/ui/header.jsx';

export default function AnimeSearch() {
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const lastSearchRef = useRef({ query: '', page: 0 });

  useEffect(() => {
    document.body.style.backgroundColor = 'var(--color-anime-background)';
    
    const searchQuery = searchParams.get('q');
    const page = parseInt(searchParams.get('page')) || 1;
    
    // Prevent duplicate requests for the same query and page
    if (searchQuery && 
        (searchQuery !== lastSearchRef.current.query || page !== lastSearchRef.current.page)) {
      setQuery(searchQuery);
      setCurrentPage(page);
      performSearch(searchQuery, page);
      lastSearchRef.current = { query: searchQuery, page };
    }
  }, [searchParams]);

  const performSearch = async (searchQuery, page = 1) => {
    if (!searchQuery || searchQuery.trim() === '') return;
    
    setLoading(true);
    try {
      const { totalPages: total, results } = await searchAnime(searchQuery, page);
      setSearchResults(results);
      setTotalPages(total);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResults = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="bg-anime-card-bg border border-anime-border/10 rounded-lg overflow-hidden animate-pulse">
              <div className="w-full h-64 bg-anime-skeleton-bg"></div>
              <div className="p-3">
                <div className="h-4 bg-anime-skeleton-bg rounded mb-2"></div>
                <div className="h-3 bg-anime-skeleton-bg rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!searchResults || searchResults.length === 0) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-white opacity-60 text-lg mb-2">No results found</p>
            <p className="text-white opacity-40">Try searching with different keywords</p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {searchResults.map((anime, index) => (
          <Link
            key={anime.id || index}
            to={`/anime/${anime.id}`}
            className="anime-card bg-anime-card-bg border border-anime-border/10 rounded-lg overflow-hidden hover:bg-anime-skeleton-bg transition duration-200 ease cursor-pointer"
          >
            <div className="relative">
              <img 
                src={anime.poster || `https://placehold.co/200x300/141414/fff/?text=${encodeURIComponent(anime.title || 'Unknown')}&font=poppins`}
                alt={anime.title || 'Anime'} 
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-2 left-2 flex flex-col space-y-1">
                {anime.tvInfo?.quality && anime.tvInfo.quality.includes('HD') && (
                  <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-md font-medium">
                    HD
                  </span>
                )}
                {anime.tvInfo?.sub && (
                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-medium">
                    SUB {anime.tvInfo.sub}
                  </span>
                )}
                {anime.tvInfo?.dub && (
                  <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-md font-medium">
                    DUB {anime.tvInfo.dub}
                  </span>
                )}
                {anime.tvInfo?.eps && (
                  <span className="text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded-md font-medium">
                    {anime.tvInfo.eps} EPS
                  </span>
                )}
                {anime.duration && (
                  <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded-md font-medium">
                    {anime.duration}
                  </span>
                )}
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-semibold mb-1 text-white truncate">{anime.title || 'Unknown Anime'}</h3>
              {anime.japanese_title && (
                <p className="text-xs text-white/50 truncate">{anime.japanese_title}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }
    
    // Previous button
    if (currentPage > 1) {
      pages.push(
        <Link
          key="prev"
          to={`/anime/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
          className="bg-anime-card-bg border border-anime-border/10 rounded-md px-3 py-1 hover:bg-[#1f1f1f] transition-colors"
        >
          &laquo;
        </Link>
      );
    }
    
    // First page
    if (startPage > 1) {
      pages.push(
        <Link
          key="1"
          to={`/anime/search?q=${encodeURIComponent(query)}&page=1`}
          className="bg-anime-card-bg border border-anime-border/10 rounded-md px-3 py-1 hover:bg-[#1f1f1f] transition-colors"
        >
          1
        </Link>
      );
      
      if (startPage > 2) {
        pages.push(<span key="dots1" className="px-2">...</span>);
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      pages.push(
        <Link
          key={i}
          to={`/anime/search?q=${encodeURIComponent(query)}&page=${i}`}
          className={`border rounded-md px-3 py-1 transition-colors ${
            isActive 
              ? 'bg-accent text-white border-accent' 
              : 'bg-anime-card-bg border-anime-border/10 hover:bg-[#1f1f1f]'
          }`}
        >
          {i}
        </Link>
      );
    }
    
    // Last page (if not included in the range)
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="px-2">...</span>);
      }
      
      pages.push(
        <Link
          key={totalPages}
          to={`/anime/search?q=${encodeURIComponent(query)}&page=${totalPages}`}
          className="bg-anime-card-bg border border-anime-border/10 rounded-md px-3 py-1 hover:bg-[#1f1f1f] transition-colors"
        >
          {totalPages}
        </Link>
      );
    }
    
    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <Link
          key="next"
          to={`/anime/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
          className="bg-anime-card-bg border border-anime-border/10 rounded-md px-3 py-1 hover:bg-[#1f1f1f] transition-colors"
        >
          &raquo;
        </Link>
      );
    }
    
    return (
      <div className="flex space-x-2 items-center text-white">
        {pages}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white">
      <AnimeHeader />
      
      <div className="search-container pt-20 pb-8 px-4 w-full max-w-7xl mx-auto">
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Search Results for "{query}"</h1>
            <p className="text-white/60">
              {loading ? 'Searching...' : `Found ${searchResults.length} results`}
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </p>
          </div>
        )}
        
        <div id="search-results" className="min-h-[50vh]">
          {renderSearchResults()}
        </div>
        
        <div id="search-pagination" className="mt-8 flex justify-center">
          {renderPaginationControls()}
        </div>
      </div>
    </div>
  );
}
