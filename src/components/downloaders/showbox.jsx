import config from '../../config.json';
import { fetchTmdb } from '../../utils.jsx';

const searchShowbox = async (searchKeyword, proxyUrl) => {
  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({url: `https://www.showbox.media/search?keyword=${encodeURIComponent(searchKeyword)}`, method: 'POST', cf: true, headers: {'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}})
    });
    
    return await response.text();
  } catch (error) { return null; }
};

const getShowPage = async (href, proxyUrl) => {
  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({url: `https://www.showbox.media${href}`, method: 'GET', cf: true, headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}})
    });
    
    return await response.text();
  } catch (error) { return null; }
};

const extractAjaxDetails = (html) => {
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1];
    
    if (scriptContent.includes('share_link')) {
      const urlMatch = scriptContent.match(/url\s*:\s*['"]([^'"]+)['"]/)
      if (!urlMatch) continue;
      
      const ajaxUrl = urlMatch[1];
      
      const dataPatterns = [
        /data\s*:\s*\{[^}]*'id'\s*:\s*(\d+)[^}]*'type'\s*:\s*(\d+)[^}]*\}/,
        /data\s*:\s*\{[^}]*"id"\s*:\s*(\d+)[^}]*"type"\s*:\s*(\d+)[^}]*\}/,
        /\{\s*'id'\s*:\s*(\d+)\s*,\s*'type'\s*:\s*(\d+)\s*\}/,
        /\{\s*"id"\s*:\s*(\d+)\s*,\s*"type"\s*:\s*(\d+)\s*\}/
      ];
      
      for (const pattern of dataPatterns) {
        const dataMatch = scriptContent.match(pattern);
        if (dataMatch) {
          return {
            url: ajaxUrl,
            data: { id: parseInt(dataMatch[1]), type: parseInt(dataMatch[2]) }
          };
        }
      }
    }
  }
  
  return null;
};

const getShareLink = async (ajaxUrl, ajaxData, proxyUrl) => {
  try {
    const params = new URLSearchParams(ajaxData).toString();
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url: `https://www.showbox.media${ajaxUrl}?${params}`, method: 'GET', cf: true, headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}})
    });
    
    const responseData = await response.json();
    
    if (responseData.code === 1 && responseData.data && responseData.data.link) { return responseData.data.link.replace(/\\\//g, '/'); }
    
    return null;
  } catch (error) { return null; }
};

const parseSearchResults = (html, tmdbData, contentType) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const items = doc.querySelectorAll('div.flw-item');
  
  const results = [];
  let matchedItem = null;
  
  const tmdbTitle = tmdbData.name || tmdbData.title;
  const tmdbYear = (tmdbData.first_air_date || tmdbData.release_date || '').substring(0, 4);
  
  items.forEach(item => {
    const titleElement = item.querySelector('h2.film-name');
    if (!titleElement) return;
    
    const titleLink = titleElement.querySelector('a');
    if (!titleLink) return;
    
    const title = titleLink.getAttribute('title') || '';
    const href = titleLink.getAttribute('href') || '';
    
    const hrefYearMatch = href.match(/(\d{4})$/);
    const hrefYear = hrefYearMatch ? hrefYearMatch[1] : null;
    
    const infoSection = item.querySelector('div.fd-infor');
    if (!infoSection) return;
    
    const typeElement = infoSection.querySelector('span.float-right.fdi-type');
    if (!typeElement) return;
    
    const itemContentType = typeElement.textContent.trim();
    
    if (itemContentType === 'Movie' && contentType === 'movie') {
      const fdiItems = infoSection.querySelectorAll('span.fdi-item');
      let releaseYear = null;
      let runtime = null;
      
      fdiItems.forEach(span => {
        const text = span.textContent.trim();
        if (/^\d{4}$/.test(text)) { releaseYear = parseInt(text);
        } else if (text.includes('m') && /\d/.test(text)) { runtime = text; }
      });
      
      const itemData = {type: 'movie',name: title, release_year: releaseYear, runtime: runtime, href: href};
      
      results.push(itemData);
      
      if (title.toLowerCase() === tmdbTitle.toLowerCase() && String(releaseYear) === tmdbYear) { matchedItem = itemData; }
    } else if (itemContentType === 'TV' && contentType === 'tv') {
      const fdiItems = infoSection.querySelectorAll('span.fdi-item');
      let seasonNumber = null;
      
      fdiItems.forEach(span => {
        const text = span.textContent.trim();
        if (text.startsWith('SS ')) {
          try { seasonNumber = parseInt(text.replace('SS ', '')); } catch (e) {}
        }
      });
      
      const itemData = {type: 'tv', name: title, season_number: seasonNumber, href: href, href_year: hrefYear};
      results.push(itemData);
      
      if (title.toLowerCase() === tmdbTitle.toLowerCase()) {
        if (seasonNumber && !matchedItem) { matchedItem = itemData; }
        else if (!matchedItem && hrefYear === tmdbYear) { matchedItem = itemData; }
      }
    }
  });
  
  return { results, matchedItem };
};

export const getShowboxDownloadLink = async (tmdbId, contentType) => {
  try {
    const { proxy } = config;
    if (!proxy) { return null; }
    
    const tmdbData = await fetchTmdb(`/${contentType}/${tmdbId}`);
    if (!tmdbData) { return null; }

    const tmdbTitle = tmdbData.name || tmdbData.title;
    
    const searchHtml = await searchShowbox(tmdbTitle, proxy);
    if (!searchHtml) { return null; }
    
    const { results, matchedItem } = parseSearchResults(searchHtml, tmdbData, contentType);
    if (!matchedItem) { return null; }
    
    const showPageHtml = await getShowPage(matchedItem.href, proxy);
    if (!showPageHtml) { return null; }
    
    const ajaxDetails = extractAjaxDetails(showPageHtml);
    if (!ajaxDetails) { return null; }
    
    const shareLink = await getShareLink(ajaxDetails.url, ajaxDetails.data, proxy);
    if (!shareLink) { return null; }
    return shareLink;
    
  } catch (error) { return null; }
};
