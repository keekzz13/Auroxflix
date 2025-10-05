// Episode Thumbnails Component

import { fetchTmdb, getTmdbImage } from '../../utils.jsx';
import { findTmdbIdForTitle, findTmdbIdForSeason } from './animeDetailsData.jsx';

export async function fetchEpisodeThumbnails(episodeCount, seasonNumber = 1, title = '') {
  if (!episodeCount) {
    console.error('Missing required parameters for fetching thumbnails');
    return null;
  }

  try {
    if (title) {
      // Try to find TMDB ID for the specific season first
      const seasonData = await findTmdbIdForSeason(title);
      if (seasonData?.tmdbId) {
        return await fetchTmdbThumbnails(seasonData.tmdbId, episodeCount, seasonData.seasonNumber || seasonNumber);
      }
      
      // Fallback to general title search
      const tmdbId = await findTmdbIdForTitle(title);
      if (tmdbId) {
        return await fetchTmdbThumbnails(tmdbId, episodeCount, seasonNumber);
      }
    }
    
    console.error('Could not find TMDB ID');
    return null;
  } catch (error) {
    console.error('Error fetching episode thumbnails:', error);
    return null;
  }
}

export async function fetchTmdbThumbnails(tmdbId, episodeCount, seasonNumber = 1) {
  try {
    if (!tmdbId) {
      console.error('No TMDB ID provided for fetching thumbnails');
      return null;
    }
    
    console.log(`Fetching TMDB thumbnails for ID: ${tmdbId}, Season: ${seasonNumber}, Episodes: ${episodeCount}`);
    
    const data = await fetchTmdb(`/tv/${tmdbId}/season/${seasonNumber}`);
    const episodes = data.episodes || [];
    
    const thumbnails = [];
    
    for (let episodeNo = 1; episodeNo <= episodeCount; episodeNo++) {
      const tmdbEpisode = episodes.find(ep => ep.episode_number === episodeNo) || {};
      
      thumbnails.push({
        episode_no: episodeNo,
        thumbnail: tmdbEpisode.still_path ? getTmdbImage(tmdbEpisode.still_path, 'w300') : null,
        name: tmdbEpisode.name || `Episode ${episodeNo}`,
        description: tmdbEpisode.overview || null,
        air_date: tmdbEpisode.air_date || null
      });
    }
    
    return thumbnails;
  } catch (error) {
    console.error('Error fetching TMDB thumbnails:', error);
    return null;
  }
}
