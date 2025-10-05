import { fetchTmdb } from '../../utils.jsx';
import config from '../../config.json';
import Fuse from 'fuse.js';

const domain = "vegamovies.bh"; // make it somehow automatically find the latest domain instead of manually updating it.

const findBestFuzzyMatch = (targetTitle, targetYear, candidates) => {
  const fuseOptions = {
    keys: ['title'],
    threshold: 0.6,
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
    findAllMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    getFn: (obj, path) => {
      const title = obj.title;
      if (targetYear && title.includes(targetYear)) { return `${title} YEAR_MATCH_BOOST`; }
      return title;
    }
  };
  
  const searchQuery = targetYear ? `${targetTitle} ${targetYear}` : targetTitle;
  const fuse = new Fuse(candidates, fuseOptions);
  const results = fuse.search(searchQuery);
  
  if (results.length === 0) {
    return null;
  }
  
  const bestResult = results[0];
  const score = 1 - bestResult.score;
  
  return { candidate: bestResult.item, index: candidates.indexOf(bestResult.item), score: score };
};

const extractQualityTags = (title) => {
  const qualityTags = ['PREHD', 'PRE-HD', 'WEB-DL', 'HDTS', 'HDR', 'BDRip', 'Dual Audio', 'BluRay'];
  const foundTags = [];
  let cleanedTitle = title;
  
  const hindiComboPattern = /\(Hindi\s*[-–]\s*([^)]+)\)/gi;
  const hindiComboMatch = hindiComboPattern.exec(cleanedTitle);
  if (hindiComboMatch) {
    foundTags.push(`Hindi - ${hindiComboMatch[1].trim()}`);
    cleanedTitle = cleanedTitle.replace(hindiComboPattern, '');
  } else if (/\bHindi\b/i.test(cleanedTitle)) {
    foundTags.push('Hindi');
    cleanedTitle = cleanedTitle.replace(/\bHindi\b/gi, '');
  }
  
  cleanedTitle = cleanedTitle.replace(/\(\s*[-–]\s*[^)]*\)/g, '');
  cleanedTitle = cleanedTitle.replace(/\(\s*\)/g, '');
  
  qualityTags.forEach(tag => {
    const pattern = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (pattern.test(cleanedTitle)) {
      foundTags.push(tag);
      cleanedTitle = cleanedTitle.replace(pattern, '');
    }
  });
  
  cleanedTitle = cleanedTitle.replace(/(?:1080p|720p|480p)(?:\s*[-–]\s*(?:1080p|720p|480p))*/gi, '');
  cleanedTitle = cleanedTitle.replace(/\s+/g, ' ').trim();
  
  return { cleanedTitle, foundTags };
};

const searchVegamovies = async (searchQuery, proxyUrl) => {
  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `https://${domain}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        form_data: {
          'do': 'search',
          'subaction': 'search',
          'story': searchQuery
        }
      })
    });
    
    return await response.text();
  } catch (error) {
    console.warn('Failed to search Vegamovies:', error);
    return null;
  }
};

const getVegamoviesPage = async (href, proxyUrl) => {
  try {
    let fullUrl = href;
    if (href.startsWith('/')) {
      fullUrl = `https://${domain}${href}`;
    }
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: fullUrl,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    });
    
    return await response.text();
  } catch (error) {
    console.warn('Failed to get Vegamovies page:', error);
    return null;
  }
};

export const getVegamoviesDownloads = async (tmdbId) => {
  try {
    const { proxy } = config;
    if (!proxy) {
      console.warn('No proxy configured for Vegamovies');
      return [];
    }
    
    const tmdbData = await fetchTmdb(`/movie/${tmdbId}`);
    if (!tmdbData) {
      console.warn('Failed to get TMDB data for Vegamovies');
      return [];
    }
    
    const releaseYear = tmdbData.release_date ? tmdbData.release_date.substring(0, 4) : '';
    const searchQuery = `${tmdbData.title} ${releaseYear}`;
    
    const searchHtml = await searchVegamovies(searchQuery, proxy);
    if (!searchHtml) {
      return [];
    }
    
    const parser = new DOMParser();
    const searchDoc = parser.parseFromString(searchHtml, 'text/html');
    const postItems = searchDoc.querySelectorAll('article.post-item.site__col');
    
    if (postItems.length === 0) {
      console.warn('No search results found on Vegamovies');
      return [];
    }
    
    const candidates = [];
    postItems.forEach((postItem, index) => {
      const aTag = postItem.querySelector('a[title]');
      if (aTag) {
        const title = aTag.getAttribute('title');
        candidates.push({ title, postItem, index });
      }
    });
    
    let selectedPostItem = null;
    
    if (candidates.length > 0) {
      const bestMatch = findBestFuzzyMatch(tmdbData.title, releaseYear, candidates);
      
      if (bestMatch && bestMatch.score > 0.3) {
        selectedPostItem = bestMatch.candidate.postItem;
      } else {
        selectedPostItem = postItems[0];
      }
    } else { return []; }
    
    const aTag = selectedPostItem.querySelector('a');
    if (!aTag) {
      console.warn('No link found in selected Vegamovies search result');
      return [];
    }
    
    const href = aTag.getAttribute('href');
    if (!href) {
      console.warn('No href found in selected Vegamovies search result');
      return [];
    }
    
    const pageHtml = await getVegamoviesPage(href, proxy);
    if (!pageHtml) {
      return [];
    }
    
    const pageDoc = parser.parseFromString(pageHtml, 'text/html');
    const downloadLinks = pageDoc.querySelectorAll('a.btn[href*="fast-dl.lol"]');
    const titleElement = pageDoc.querySelector('h1.entry-title');
    
    if (!titleElement) {
      console.warn('No title found on Vegamovies page');
      return [];
    }
    
    const title = titleElement.textContent.trim();
    const { cleanedTitle, foundTags: qualityTags } = extractQualityTags(title);
    
    const results = [];
    
    downloadLinks.forEach(aTag => {
      try {
        const h3Container = aTag.closest('div')?.closest('h3');
        if (h3Container) {
          const previousH3 = h3Container.previousElementSibling;
          if (previousH3 && previousH3.tagName === 'H3') {
            const tags = [];
            
            tags.push(previousH3.textContent.trim());
            
            const linkText = aTag.textContent.trim();
            const bracketMatch = linkText.match(/\[([^\]]+)\]/);
            if (bracketMatch) {
              tags.push(bracketMatch[1].trim());
            }
            
            tags.push(...qualityTags);
            
            const downloadUrl = aTag.getAttribute('href');
            if (downloadUrl) {
              results.push({
                source: 'Vegamovies',
                title: cleanedTitle,
                url: downloadUrl,
                tags: tags.filter(tag => tag && tag.trim()),
                type: 'download'
              });
            }
          }
        }
      } catch (error) {
        console.warn('Error processing Vegamovies download link:', error);
      }
    });
    
    return results;
  } catch (error) {
    console.warn('Failed to get Vegamovies downloads:', error);
    return [];
  }
};
