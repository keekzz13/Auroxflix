import React from 'react';

export const SpotlightSkeleton = () => {
  return (
    <div className="relative w-full h-[80vh] bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a] flex items-end animate-fade-in overflow-hidden">
      {/* Enhanced gradient overlays with better depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0a]/90 via-black/30 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0a]/95 via-black/20 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#090a0a]/70 via-[#090a0a]/5 to-transparent"></div>
      
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] animate-pulse"></div>
      </div>
      
      <div className="relative z-10 p-8 pb-6 w-full pr-0 space-y-6">
        {/* Logo/Title with enhanced styling */}
        <div className="skeleton-base skeleton-shimmer w-[28rem] h-20 mb-6 rounded-xl shadow-2xl"></div>
        
        {/* Rating and info with better spacing */}
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton-base skeleton-shimmer w-16 h-7 rounded-full shadow-lg"></div>
          <div className="skeleton-base skeleton-shimmer w-10 h-5 rounded-md"></div>
          <div className="skeleton-base skeleton-shimmer w-24 h-5 rounded-md"></div>
          <div className="skeleton-base skeleton-shimmer w-20 h-5 rounded-md"></div>
          <div className="skeleton-base skeleton-shimmer w-28 h-5 rounded-md"></div>
        </div>
        
        {/* Description with improved layout */}
        <div className="mb-20 space-y-3 max-w-2xl">
          <div className="skeleton-base skeleton-shimmer w-full h-5 rounded-lg"></div>
          <div className="skeleton-base skeleton-shimmer w-[90%] h-5 rounded-lg"></div>
          <div className="skeleton-base skeleton-shimmer w-[75%] h-5 rounded-lg"></div>
        </div>
        
        {/* Action buttons with enhanced design */}
        <div className="flex flex-row mb-6 w-full justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="skeleton-base skeleton-shimmer w-12 h-12 !rounded-full shadow-xl ring-2 ring-white/10"></div>
            <div className="skeleton-base skeleton-shimmer w-40 h-12 !rounded-full shadow-lg"></div>
            <div className="skeleton-base skeleton-shimmer w-12 h-12 !rounded-full shadow-lg ring-1 ring-white/5"></div>
            <div className="skeleton-base skeleton-shimmer w-12 h-12 !rounded-full shadow-lg ring-1 ring-white/5"></div>
          </div>
          <div className="skeleton-base skeleton-shimmer w-20 h-9 rounded-lg shadow-md"></div>
        </div>
        
        {/* Genre tags with pill design */}
        <div className="flex gap-3 mb-4">
          <div className="skeleton-base skeleton-shimmer w-20 h-6 rounded-full"></div>
          <div className="skeleton-base skeleton-shimmer w-24 h-6 rounded-full"></div>
          <div className="skeleton-base skeleton-shimmer w-22 h-6 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export const MediaCardSkeleton = () => {
  return (
    <div className="flex-shrink-0 w-full animate-fade-in group">
      <div className="skeleton-base skeleton-shimmer w-full aspect-video rounded-xl mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
      <div className="space-y-2">
        <div className="skeleton-base skeleton-shimmer w-4/5 h-5 rounded-lg"></div>
        <div className="skeleton-base skeleton-shimmer w-3/5 h-4 rounded-md"></div>
      </div>
    </div>
  );
};

export const CategorySkeleton = ({ title, episodeCount = 0 }) => {
  const getSkeletonClass = () => {
    if (title !== 'Episodes') return 'skeleton-shimmer';
    
    if (episodeCount > 100) return 'skeleton-shimmer-fast';
    if (episodeCount > 50) return 'skeleton-shimmer-medium';
    if (episodeCount > 25) return 'skeleton-shimmer-slow';
    return 'skeleton-shimmer';
  };

  const skeletonClass = getSkeletonClass();

  return (
    <div className="mb-10 animate-fade-in">
      <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">{title}</h2>
      <div className="flex space-x-6 overflow-x-auto scrollbar-hide py-6 pl-6 -ml-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex-shrink-0 w-full animate-fade-in group">
            <div className={`skeleton-base ${skeletonClass} w-full aspect-video rounded-xl mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}></div>
            <div className="space-y-2">
              <div className={`skeleton-base ${skeletonClass} w-4/5 h-5 rounded-lg`}></div>
              <div className={`skeleton-base ${skeletonClass} w-3/5 h-4 rounded-md`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SearchSkeleton = () => {
  return (
    <div className="animate-fade-in mb-10">
      <h2 className="text-2xl font-semibold text-white mb-6 tracking-tight">Search Results</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 py-6">
        {[...Array(15)].map((_, index) => (
          <MediaCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export const AnimeSpotlightSkeleton = () => {
  return (
    <section className="relative bg-gradient-to-br from-anime-card-bg via-anime-card-bg/90 to-anime-card-bg rounded-3xl overflow-hidden h-[60vh] mb-6 animate-fade-in shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-t from-anime-background/95 via-anime-background/40 to-transparent"></div>
      
      {/* Subtle animated overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.05)_0%,transparent_50%)] animate-pulse"></div>
      
      <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-3/5 lg:w-1/2 z-10 space-y-6">
        <div className="skeleton-base skeleton-shimmer w-5/6 h-16 md:h-20 rounded-2xl shadow-2xl"></div>
        
        <div className="space-y-3">
          <div className="skeleton-base skeleton-shimmer w-full h-5 rounded-lg"></div>
          <div className="skeleton-base skeleton-shimmer w-11/12 h-5 rounded-lg"></div>
          <div className="skeleton-base skeleton-shimmer w-4/5 h-5 rounded-lg"></div>
        </div>
        
        <div className="flex items-center space-x-4 pt-2">
          <div className="skeleton-base skeleton-shimmer w-36 h-12 rounded-xl shadow-lg"></div>
          <div className="skeleton-base skeleton-shimmer w-28 h-12 rounded-xl shadow-md"></div>
        </div>
      </div>
      
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 flex space-x-3 z-10">
        <div className="skeleton-base skeleton-shimmer w-12 h-12 rounded-xl shadow-lg ring-1 ring-white/10"></div>
        <div className="skeleton-base skeleton-shimmer w-12 h-12 rounded-xl shadow-lg ring-1 ring-white/10"></div>
      </div>
    </section>
  );
};
