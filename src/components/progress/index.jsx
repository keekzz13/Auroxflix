import { saveProgress, getProgress, getAllProgress, getAllContinueWatching } from './progressManager.jsx';
import {
  setupVidLinkTracking,
  setupVidoraTracking,
  setupVidFastTracking,
  setupVideasyTracking,
  setupVidsrcXYZTracking,
  setupFoxTracking,
  setupPrimeNetTracking
} from './sourceTrackers.jsx';

export function initializeSourceTracking(playerIframe, source, mediaId, mediaType, season, episode, sourceIndex) {
  const sourceTrackers = {
    'VidLink': setupVidLinkTracking,
    'VidsrcXYZ': setupVidsrcXYZTracking,
    'Vidora': setupVidoraTracking,
    'VidFast': setupVidFastTracking,
    'Videasy': setupVideasyTracking,
    'fox': setupFoxTracking,
    'primenet': setupPrimeNetTracking,
  };
  
  const trackerSetup = sourceTrackers[source];
  
  if (trackerSetup) {
    console.log(`Initializing progress tracking for ${source}`);
    return trackerSetup(playerIframe, mediaId, mediaType, season, episode, sourceIndex);
  } else {
    console.log(`No progress tracking available for ${source}`);
    return () => {};
  }
}

export function injectVidLinkListener() {
  const script = document.createElement('script');
  script.id = 'vidlink-listener';
  script.textContent = `
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://vidlink.pro') return;
      
      if (event.data?.type === 'MEDIA_DATA') {
        const mediaData = event.data.data;
        console.log('VidLink media data received:', mediaData);
      }
    });
  `;
  
  if (!document.getElementById('vidlink-listener')) {
    document.head.appendChild(script);
  }
}

export function getProgressPercentage(mediaId, mediaType, season = 0, episode = 0) {
  const progress = getProgress(parseInt(mediaId), mediaType, parseInt(season), parseInt(episode));
  
  if (progress && progress.fullDuration > 0) {
    return Math.min(100, Math.round((progress.watchedDuration / progress.fullDuration) * 100));
  }
  
  return 0;
}

export function hasStartedWatching(mediaId, mediaType, season = 0, episode = 0) {
  const progress = getProgress(parseInt(mediaId), mediaType, parseInt(season), parseInt(episode));
  return progress !== null && progress.watchedDuration > 0;
}

export function hasCompletedWatching(mediaId, mediaType, season = 0, episode = 0) {
  const progressPercent = getProgressPercentage(parseInt(mediaId), mediaType, parseInt(season), parseInt(episode));
  return progressPercent >= 90;
}

export function getMostRecentEpisode(mediaId) {
  const allProgress = getAllProgress(parseInt(mediaId), 'tv');
  
  if (allProgress.length === 0) return null;
  return allProgress[allProgress.length - 1];
}

export { saveProgress, getProgress, getAllProgress, getAllContinueWatching };
