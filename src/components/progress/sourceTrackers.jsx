import { saveProgress } from './progressManager.jsx';

export function setupVidLinkTracking(playerIframe, mediaId, mediaType, season, episode, sourceIndex) {
  const messageHandler = (event) => {
    if (event.origin !== 'https://vidlink.pro') return;
    
    if (event.data?.type === 'MEDIA_DATA') {
      const mediaData = event.data.data;
      console.log('VidLink media data:', mediaData);
      
      // get existing progress from nepoflixwatch-continue
      const continueData = JSON.parse(localStorage.getItem('continue') || '[]');
      const existingProgress = continueData.find(item => 
        item.id === parseInt(mediaId) && 
        item.mediaType === mediaType &&
        (mediaType === 'movie' || (item.season === parseInt(season) && item.episode === parseInt(episode)))
      );

      console.log('Current progress:', existingProgress);
      
      // process all media items in the received data
      Object.entries(mediaData).forEach(([id, mediaItem]) => {
        if (mediaItem.type === 'tv' && mediaItem.show_progress) {
          // save all episodes' progress
          Object.entries(mediaItem.show_progress).forEach(([episodeKey, episodeData]) => {
            if (episodeData.progress) {
              saveProgress({
                id: parseInt(id),
                mediaType: 'tv',
                season: parseInt(episodeData.season),
                episode: parseInt(episodeData.episode),
                sourceIndex: parseInt(sourceIndex),
                fullDuration: parseInt(episodeData.progress.duration || 0),
                watchedDuration: parseInt(episodeData.progress.watched || 0),
                timestamp: parseInt(Date.now())
              });
            }
          });
        } else if (mediaItem.type === 'movie' && mediaItem.progress) {
          // save movie progress
          saveProgress({
            id: parseInt(id),
            mediaType: 'movie',
            season: 0,
            episode: 0,
            sourceIndex: parseInt(sourceIndex),
            fullDuration: parseInt(mediaItem.progress.duration || existingProgress?.fullDuration || 0),
            watchedDuration: parseInt(mediaItem.progress.watched || existingProgress?.watchedDuration || 0),
            timestamp: parseInt(mediaItem.last_updated || Date.now())
          });
        }
      });
      
      // save the current media being watched
      const currentMediaItem = mediaData[mediaId];
      if (currentMediaItem) {
        if (mediaType === 'tv') {
          const episodeKey = `s${season}e${episode}`;
          const episodeData = currentMediaItem.show_progress?.[episodeKey];
          if (episodeData?.progress) {
            saveProgress({
              id: parseInt(mediaId),
              mediaType: mediaType,
              season: parseInt(season),
              episode: parseInt(episode),
              sourceIndex: parseInt(sourceIndex),
              fullDuration: parseInt(episodeData.progress.duration || 0),
              watchedDuration: parseInt(episodeData.progress.watched || 0),
              timestamp: parseInt(Date.now())
            });
          }
        }
      }
    }
  };
  
  window.addEventListener('message', messageHandler);
  
  return () => {
    window.removeEventListener('message', messageHandler);
  };
}

export function setupVidsrcXYZTracking(playerIframe, mediaId, mediaType, season, episode, sourceIndex) {
  const messageHandler = (event) => {
    if (event.origin !== 'https://vidsrc.xyz') {
      return;
    }
    
    if (event.data?.type === 'PLAYER_EVENT') {
      const playerData = event.data?.data;
      console.log('VidsrcXYZ player data:', playerData);
      
      if (playerData && playerData.tmdbId && playerData.currentTime && playerData.duration) {
        const continueData = JSON.parse(localStorage.getItem('continue') || '[]');
        const existingProgress = continueData.find(item => 
          item.id === parseInt(mediaId) && 
          item.mediaType === mediaType &&
          (mediaType === 'movie' || (item.season === season && item.episode === episode))
        );
        
        console.log('Current progress:', existingProgress);
        
        saveProgress({
          id: parseInt(playerData.tmdbId),
          mediaType: playerData.type || mediaType,
          season: playerData.season || season || 0,
          episode: playerData.episode || episode || 0,
          sourceIndex: sourceIndex,
          fullDuration: playerData.duration || existingProgress?.fullDuration || 0,
          watchedDuration: playerData.currentTime || existingProgress?.watchedDuration || 0,
          timestamp: Date.now()
        });
      }
    }
  };
  
  window.addEventListener('message', messageHandler);
  
  return () => {
    window.removeEventListener('message', messageHandler);
  };
}

export function setupVidoraTracking(playerIframe, mediaId, mediaType, season, episode, sourceIndex) {
  const messageHandler = (event) => {
    if (event.origin !== 'https://vidora.su') return;
    
    if (event.data?.type === 'MEDIA_DATA') {
      const mediaData = event.data.data;
      console.log('Vidora media data:', mediaData);
      
      const continueData = JSON.parse(localStorage.getItem('continue') || '[]');
      const existingProgress = continueData.find(item => 
        item.id === parseInt(mediaId) && 
        item.mediaType === mediaType &&
        (mediaType === 'movie' || (item.season === parseInt(season) && item.episode === parseInt(episode)))
      );
      
      if (mediaData) {
        if (mediaData.type === 'tv' && mediaData.show_progress) {
          Object.entries(mediaData.show_progress).forEach(([episodeKey, episodeData]) => {
            if (episodeData.progress) {
              saveProgress({
                id: parseInt(mediaData.id),
                mediaType: 'tv',
                season: parseInt(episodeData.season),
                episode: parseInt(episodeData.episode),
                sourceIndex: parseInt(sourceIndex),
                fullDuration: parseInt(episodeData.progress.duration || 0),
                watchedDuration: parseInt(episodeData.progress.watched || 0),
                timestamp: parseInt(episodeData.last_updated || Date.now())
              });
            }
          });
          
          if (mediaData.id === mediaId) {
            const episodeKey = `s${season}e${episode}`;
            const episodeData = mediaData.show_progress?.[episodeKey];
            if (episodeData?.progress) {
              saveProgress({
                id: parseInt(mediaId),
                mediaType: 'tv',
                season: parseInt(season),
                episode: parseInt(episode),
                sourceIndex: parseInt(sourceIndex),
                fullDuration: parseInt(episodeData.progress.duration || 0),
                watchedDuration: parseInt(episodeData.progress.watched || 0),
                timestamp: parseInt(episodeData.last_updated || Date.now())
              });
            }
          }
        } else if (mediaData.type === 'movie' && mediaData.progress) {
          saveProgress({
            id: parseInt(mediaData.id),
            mediaType: 'movie',
            season: 0,
            episode: 0,
            sourceIndex: parseInt(sourceIndex),
            fullDuration: parseInt(mediaData.progress.duration || existingProgress?.fullDuration || 0),
            watchedDuration: parseInt(mediaData.progress.watched || existingProgress?.watchedDuration || 0),
            timestamp: parseInt(mediaData.last_updated || Date.now())
          });
        }
      }
    }
  };
  
  window.addEventListener('message', messageHandler);
  
  return () => {
    window.removeEventListener('message', messageHandler);
  };
}

export function setupVidFastTracking(playerIframe, mediaId, mediaType, season, episode, sourceIndex) {
  const messageHandler = (event) => {
    if (event.origin !== 'https://vidfast.pro') {
      return;
    }
    
    if (event.data?.type === 'PLAYER_EVENT') {
      const playerData = event.data?.data;
      console.log('VidFast player data:', playerData);
      
      if (playerData && playerData.tmdbId && playerData.currentTime && playerData.duration) {
        const continueData = JSON.parse(localStorage.getItem('continue') || '[]');
        const existingProgress = continueData.find(item => 
          item.id === parseInt(mediaId) && 
          item.mediaType === mediaType &&
          (mediaType === 'movie' || (item.season === season && item.episode === episode))
        );
        
        console.log('Current progress:', existingProgress);
        
        saveProgress({
          id: parseInt(playerData.tmdbId),
          mediaType: playerData.mediaType,
          season: parseInt(playerData.season) || parseInt(season) || 0,
          episode: parseInt(playerData.episode) || parseInt(episode) || 0,
          sourceIndex: parseInt(sourceIndex),
          fullDuration: parseInt(playerData.duration) || existingProgress?.fullDuration || 0,
          watchedDuration: parseInt(playerData.currentTime) || existingProgress?.watchedDuration || 0,
          timestamp: Date.now()
        });
      }
    }
  };
  
  window.addEventListener('message', messageHandler);
  
  return () => {
    window.removeEventListener('message', messageHandler);
  };
}

export function setupVideasyTracking(playerIframe, mediaId, mediaType, season, episode, sourceIndex) {
  const messageHandler = (event) => {
    if (event.origin !== 'https://player.videasy.net') return;
    
    try {
      const eventData = JSON.parse(event.data);
      if (eventData?.type === 'MEDIA_DATA') {
        const mediaData = JSON.parse(eventData.data);
        
        // get existing progress from quickwatch-continue
        const continueData = JSON.parse(localStorage.getItem('continue') || '[]');
        const existingProgress = continueData.find(item => 
          item.id === parseInt(mediaId) && 
          item.mediaType === mediaType &&
          (mediaType === 'movie' || (item.season === season && item.episode === episode))
        );

        console.log('Current progress:', existingProgress);
        
        Object.entries(mediaData).forEach(([key, mediaItem]) => {
          const id = parseInt(mediaItem.id);
          
          if (mediaItem.mediaType === 'tv' && mediaItem.show_progress) {
            // save all episodes' progress
            Object.entries(mediaItem.show_progress).forEach(([episodeKey, episodeData]) => {
              if (episodeData.progress) {
                saveProgress({
                  id: id,
                  mediaType: 'tv',
                  season: parseInt(episodeData.season),
                  episode: parseInt(episodeData.episode),
                  sourceIndex: sourceIndex,
                  fullDuration: episodeData.progress.duration || 0,
                  watchedDuration: episodeData.progress.watched || 0,
                  timestamp: episodeData.last_updated || Date.now()
                });
              }
            });
          } else if (mediaItem.mediaType === 'movie' && mediaItem.progress) {
            // save movie progress
            saveProgress({
              id: id,
              mediaType: 'movie',
              season: 0,
              episode: 0,
              sourceIndex: sourceIndex,
              fullDuration: mediaItem.progress.duration || existingProgress?.fullDuration || 0,
              watchedDuration: mediaItem.progress.watched || existingProgress?.watchedDuration || 0,
              timestamp: Date.now()
            });
          }
        });
        
        // save the current media being watched
        const currentMediaKey = `${mediaType}-${mediaId}`;
        const currentMediaItem = mediaData[currentMediaKey];
        if (currentMediaItem) {
          if (mediaType === 'tv') {
            const episodeKey = `s${season}e${episode}`;
            const episodeData = currentMediaItem.show_progress?.[episodeKey];
            if (episodeData?.progress) {
              saveProgress({
                id: parseInt(mediaId),
                mediaType: mediaType,
                season: parseInt(season),
                episode: parseInt(episode),
                sourceIndex: sourceIndex,
                fullDuration: episodeData.progress.duration || 0,
                watchedDuration: episodeData.progress.watched || 0,
                timestamp: episodeData.last_updated || Date.now()
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing Videasy message:', error);
    }
  };
  
  window.addEventListener('message', messageHandler);
  
  return () => {
    window.removeEventListener('message', messageHandler);
  };
}

export function setupFoxTracking(playerIframe, mediaId, mediaType, season, episode, sourceIndex) {
  return () => {};
}

export function setupPrimeNetTracking(playerIframe, mediaId, mediaType, season, episode, sourceIndex) {
return () => {};
}
