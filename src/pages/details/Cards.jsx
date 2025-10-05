import React, { useState } from 'react';
import { getTmdbImage } from '../../utils.jsx';
import { Play, ChevronDown } from 'lucide-react';
import CarouselItem from '../../components/carouselItem.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

export const EpisodeCard = ({ episode, hideImages = false, totalEpisodes = 0 }) => {
  const episodeItem = {
    id: episode.id,
    name: episode.name,
    overview: episode.overview,
    backdrop_path: episode.still_path,
    media_type: 'tv'
  };
  
  return (
    <div className="w-full">
      <CarouselItem 
        item={episodeItem} 
        variant="episode" 
        episodeNumber={episode.episode_number}
        hideImages={hideImages}
        totalEpisodes={totalEpisodes}
      />
    </div>
  );
};

export const TrailerCard = ({ video, variant = 'default' }) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`;
  
  if (variant === 'episode') {
    return (
      <div className="flex-shrink-0 w-40 md:w-96 cursor-pointer animate-scale-in transition-all !duration-300 !ease hover:scale-105 hover:z-10">
        <div className="relative rounded-lg overflow-hidden aspect-video bg-cover bg-center shadow-lg"
             style={{ backgroundImage: `url(${thumbnailUrl})` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 text-white">
              <Play className="w-4 h-4" fill="currentColor" />
              <span className="text-sm font-medium">Play now</span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-white text-lg font-medium mb-2 line-clamp-2"><span className="font-bold">{video.type}</span> {video.name}</h3>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-shrink-0 w-40 md:w-96 cursor-pointer animate-scale-in">
      <div className="relative rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:z-10 aspect-video bg-cover bg-center"
           style={{ backgroundImage: `url(${thumbnailUrl})` }}>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-normal text-lg mb-1 line-clamp-2">{video.name}</h3>
          <p className="text-neutral-300 text-sm">{video.type}</p>
        </div>
      </div>
    </div>
  );
};

export const CastCard = ({ person }) => {
  return (
    <a 
      href={`/person/${person.id}`}
      className="block flex-shrink-0 w-40 animate-scale-in text-center transition-all !duration-300 !ease hover:scale-110 hover:z-10"
    >
      <div className="relative rounded-full overflow-hidden mb-2 aspect-square bg-cover bg-center w-32 h-32 mx-auto"
           style={{ backgroundImage: `url(${getTmdbImage(person.profile_path, 'w185')})` }}>
        {!person.profile_path && (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <span className="text-white text-5xl">?</span>
          </div>
        )}
      </div>
      <h3 className="text-white font-normal text-sm mb-1 line-clamp-2">{person.name}</h3>
      <p className="text-neutral-400 text-xs line-clamp-2">{person.character || person.job}</p>
    </a>
  );
};

export const MediaCard = ({ item, variant = 'grid' }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  if (variant === 'grid') {
    return (
      <div className="w-full cursor-pointer animate-scale-in">
        <CarouselItem item={item} usePoster={false} variant="grid" />
      </div>
    );
  }
  
  return (
    <div className="flex-shrink-0 w-40 md:w-96 cursor-pointer animate-scale-in">
      <CarouselItem item={item} usePoster={isMobile} />
    </div>
  );
};

export const SeasonDropdown = ({ seasons, selectedSeason, onSeasonChange }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="bg-white/10 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/20 transition-colors outline-none">
        <span>Season {selectedSeason?.season_number || 1}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50 min-w-[200px] mr-8">
        {seasons?.map((season) => (
          <DropdownMenuItem
            key={season.id}
            onClick={() => onSeasonChange(season)}
            className="px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center gap-3"
          >
            <div className="w-12 h-16 bg-gray-600 rounded overflow-hidden flex-shrink-0">
              {season.poster_path ? (
                <img
                  src={getTmdbImage(season.poster_path, 'w92')}
                  alt={season.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg text-neutral-500">
                  ?
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">{season.name}</div>
              <div className="text-sm text-gray-400">
                {season.episode_count} episodes
              </div>
              {season.air_date && (
                <div className="text-xs text-gray-500">
                  {new Date(season.air_date).getFullYear()}
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
