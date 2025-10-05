export function saveProgress(progressData) {
  try {
    const sanitizedData = {
      ...progressData,
      id: parseInt(progressData.id),
      season: parseInt(progressData.season || 0),
      episode: parseInt(progressData.episode || 0),
      sourceIndex: parseInt(progressData.sourceIndex || 0),
      fullDuration: parseInt(progressData.fullDuration || 0),
      watchedDuration: parseInt(progressData.watchedDuration || 0),
      timestamp: parseInt(progressData.timestamp || Date.now())
    };
    
    if (!localStorage.getItem('continue')) {
      localStorage.setItem('continue', '[]');
    }
    
    let continueData = JSON.parse(localStorage.getItem('continue') || '[]');
    
    const existingIndex = continueData.findIndex(item => 
      item.id === sanitizedData.id && 
      item.mediaType === sanitizedData.mediaType &&
      (sanitizedData.mediaType === 'movie' || 
       (item.season === sanitizedData.season && item.episode === sanitizedData.episode))
    );
    
    if (existingIndex >= 0) {
      continueData[existingIndex] = sanitizedData;
    } else {
      continueData.push(sanitizedData);
    }
    
    if (continueData.length > 50) {
      continueData = continueData.slice(-50);
    }
    
    localStorage.setItem('continue', JSON.stringify(continueData));
    
    if (sanitizedData.mediaType === 'tv') {
      const oldKey = `tv-progress-${sanitizedData.id}`;
      if (localStorage.getItem(oldKey)) {
        localStorage.removeItem(oldKey);
      }
    }
    
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

export function getProgress(mediaId, mediaType, season = 0, episode = 0) {
  try {
    if (!localStorage.getItem('continue')) {
      localStorage.setItem('continue', '[]');
    }
    
    const continueData = JSON.parse(localStorage.getItem('continue') || '[]');
    
    return continueData.find(item => 
      item.id === parseInt(mediaId) && 
      item.mediaType === String(mediaType) &&
      (mediaType === 'movie' || 
       (item.season === parseInt(season) && item.episode === parseInt(episode)))
    ) || null;
  } catch (error) {
    console.error('Error getting progress:', error);
    return null;
  }
}

export function getAllProgress(mediaId, mediaType) {
  try {
    if (!localStorage.getItem('continue')) {
      localStorage.setItem('continue', '[]');
    }
    
    const continueData = JSON.parse(localStorage.getItem('continue') || '[]');
    
    return continueData.filter(item => 
      item.id === parseInt(mediaId) && 
      item.mediaType === mediaType
    );
  } catch (error) {
    console.error('Error getting all progress:', error);
    return [];
  }
}

export function getAllContinueWatching() {
  try {
    if (!localStorage.getItem('continue')) {
      localStorage.setItem('continue', '[]');
    }
    
    const continueData = JSON.parse(localStorage.getItem('continue') || '[]');
    
    // Sort by timestamp (most recent first) and filter out completed items
    return continueData
      .filter(item => {
        const progressPercent = item.fullDuration > 0 
          ? Math.min(100, Math.round((item.watchedDuration / item.fullDuration) * 100))
          : 0;
        return progressPercent > 5 && progressPercent < 90; // Only show items with meaningful progress
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20); // Limit to 20 most recent items
  } catch (error) {
    console.error('Error getting continue watching data:', error);
    return [];
  }
}
