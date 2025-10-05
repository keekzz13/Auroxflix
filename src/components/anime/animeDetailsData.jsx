// Episode details data component

import * as cheerio from 'cheerio';
import config from '../../config.json';
import { fetchTmdb, getTmdbImage } from '../../utils.jsx';

export async function extractAnimeInfo(id) {
  try {
    const response = await fetch(config.proxy, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://hianime.nz/${id}`,
        method: 'GET'
      })
    });

    const htmlContent = await response.text();
    
    const $ = cheerio.load(htmlContent);
    
    const dataId = id.split('-').pop();
    const titleElement = $('#ani_detail .film-name');
    const showType = $('#ani_detail .prebreadcrumb ol li:nth-child(2) a').text().trim() || '';
    const posterElement = $('#ani_detail .film-poster');
    const tvInfoElement = $('#ani_detail .film-stats');
    
    const tvInfo = {};
    if (tvInfoElement.length) {
      tvInfoElement.find('.tick-item, span.item').each((_, element) => {
        const el = $(element);
        const text = el.text().trim();
        const classes = el.attr('class') || '';
        
        if (classes.includes('tick-quality')) {
          tvInfo.quality = text;
        } else if (classes.includes('tick-sub')) {
          tvInfo.sub = text;
        } else if (classes.includes('tick-dub')) {
          tvInfo.dub = text;
        } else if (classes.includes('tick-pg')) {
          tvInfo.rating = text;
        } else if (el.is('span') && classes.includes('item')) {
          if (!tvInfo.showType) {
            tvInfo.showType = text;
          } else if (!tvInfo.duration) {
            tvInfo.duration = text;
          }
        }
      });
    }
    
    const elements = $('#ani_detail > .ani_detail-stage > .container > .anis-content > .anisc-info-wrap > .anisc-info > .item');
    const overviewElement = $('#ani_detail .film-description .text');
    
    const title = titleElement.text().trim() || '';
    const japaneseTitle = titleElement.attr('data-jname') || null;
    const synonymsElement = $('.item.item-title:has(.item-head:contains("Synonyms")) .name');
    const synonyms = synonymsElement.length ? synonymsElement.text().trim() : '';
    const poster = posterElement.find('img').attr('src') || null;
    
    const syncDataScript = $('#syncData');
    let anilistId = null;
    let malId = null;
    
    if (syncDataScript.length) {
      try {
        const syncData = JSON.parse(syncDataScript.html());
        anilistId = syncData.anilist_id;
        malId = syncData.mal_id;
      } catch (error) {
        console.error('Error parsing syncData:', error);
      }
    }

    let backdropImage = null;
    if (anilistId) {
      try {
        const anilistQuery = `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              bannerImage
            }
          }
        `;
        const variables = { id: parseInt(anilistId) };
        
        const anilistResponse = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: anilistQuery,
            variables: variables
          })
        });
        
        const mediaData = await anilistResponse.json();
        backdropImage = mediaData?.data?.Media?.bannerImage || null;
      } catch (error) {
        console.error('Error fetching AniList data:', error);
      }
    }

    const animeInfo = {};
    elements.each((_, element) => {
      const el = $(element);
      const key = el.find('.item-head').text().trim().replace(':', '');
      let value;
      
      if (key === 'Genres' || key === 'Producers') {
        value = el.find('a').map((_, a) => $(a).text().trim().replace(' ', '-')).get();
      } else {
        const nameElement = el.find('.name');
        value = nameElement.length ? nameElement.text().trim().replace(' ', '-') : '';
      }
      
      animeInfo[key] = value;
    });
    
    const seasonId = formatTitle(title, dataId);
    animeInfo.Overview = overviewElement.length ? overviewElement.text().trim() : '';
    animeInfo.tvInfo = tvInfo;
    
    let adultContent = false;
    if (posterElement.length) {
      const tickRate = posterElement.find('.tick-rate');
      if (tickRate.length && tickRate.text().trim().includes('18+')) {
        adultContent = true;
      }
    }
        
    const seasons = [];
    $('.os-list a').each((_, element) => {
      const el = $(element);
      
      const route = (el.attr('href') || '').replace(/^\//, '');
      const nameElement = el.find('.title');
      const name = nameElement.length ? nameElement.text().trim() : '';
      
      let background = '';
      const posterElement = el.find('.season-poster');
      if (posterElement.length && posterElement.attr('style')) {
        const style = posterElement.attr('style');
        const bgMatch = style.match(/url\(([^)]+)\)/);
        if (bgMatch && bgMatch.length > 1) {
          background = bgMatch[1];
        }
      }
      
      seasons.push({
        name,
        route,
        background
      });
    });
    
    const recommendedData = extractRecommendedData($);
    const relatedData = extractRelatedData($);
    
    return {
      adultContent,
      data_id: dataId,
      id: seasonId,
      anilistId,
      malId,
      title,
      japanese_title: japaneseTitle,
      synonyms,
      poster,
      backdrop_image: backdropImage,
      showType,
      animeInfo,
      seasons,
      recommended_data: recommendedData,
      related_data: relatedData
    };
    
  } catch (error) {
    console.error('Error extracting anime info:', error);
    return null;
  }
}

function formatTitle(title, id) {
  if (!title) return id;
  return title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') + '-' + id;
}

function extractRecommendedData($) {
  try {
    const recommendedItems = $('.cbox.r-recommendations .cbox-content .cbox-flex .ani-list-slide .swiper-slide .ails-wrap');
    const recommendedData = [];
    
    recommendedItems.each((_, element) => {
      const el = $(element);
      const link = el.find('a.film-poster-ahref').attr('href') || '';
      const dataId = link.substring(1).split('?')[0].split('-').pop();
      const poster = el.find('img.film-poster-img').attr('data-src') || '';
      const title = el.find('.ails-info .ail-title .dynamic-name').text().trim();
      const japaneseTitle = el.find('.ails-info .ail-title .dynamic-name').attr('data-jname') || '';
      
      const tvInfo = {};
      const showType = el.find('.ails-info .ail-infor .item:nth-child(1)').text().trim();
      const duration = el.find('.ails-info .ail-infor .item.duration').text().trim();
      const sub = el.find('.tick-sub').text().trim().split(' ')[0];
      const dub = el.find('.tick-dub').text().trim().split(' ')[0];
      const eps = el.find('.tick-eps').text().trim().split(' ')[0];
      
      tvInfo.showType = showType;
      tvInfo.duration = duration;
      if (sub) tvInfo.sub = sub;
      if (dub) tvInfo.dub = dub;
      if (eps) tvInfo.eps = eps;
      
      let adultContent = false;
      const tickRate = el.find('.tick-rate');
      if (tickRate.length && tickRate.text().trim().includes('18+')) {
        adultContent = true;
      }
      
      recommendedData.push({
        data_id: dataId,
        id: link.substring(1).split('?')[0],
        title,
        japanese_title: japaneseTitle,
        poster,
        tvInfo,
        adultContent
      });
    });
    
    return recommendedData;
  } catch (error) {
    console.error('Error extracting recommended data:', error);
    return [];
  }
}

function extractRelatedData($) {
  try {
    const relatedItems = $('.cbox.r-relateds .cbox-content .cbox-flex .ani-list-slide .swiper-slide .ails-wrap');
    const relatedData = [];
    
    relatedItems.each((_, element) => {
      const el = $(element);
      const link = el.find('a.film-poster-ahref').attr('href') || '';
      const dataId = link.substring(1).split('?')[0].split('-').pop();
      const poster = el.find('img.film-poster-img').attr('data-src') || '';
      const title = el.find('.ails-info .ail-title .dynamic-name').text().trim();
      const japaneseTitle = el.find('.ails-info .ail-title .dynamic-name').attr('data-jname') || '';
      
      const tvInfo = {};
      const showType = el.find('.ails-info .ail-infor .item:nth-child(1)').text().trim();
      const sub = el.find('.tick-sub').text().trim().split(' ')[0];
      const dub = el.find('.tick-dub').text().trim().split(' ')[0];
      const eps = el.find('.tick-eps').text().trim().split(' ')[0];
      
      tvInfo.showType = showType.toLowerCase();
      if (sub) tvInfo.sub = sub;
      if (dub) tvInfo.dub = dub;
      if (eps) tvInfo.eps = eps;
      
      let adultContent = false;
      const tickRate = el.find('.tick-rate');
      if (tickRate.length && tickRate.text().trim().includes('18+')) {
        adultContent = true;
      }
      
      relatedData.push({
        data_id: dataId,
        id: link.substring(1).split('?')[0],
        title,
        japanese_title: japaneseTitle,
        poster,
        tvInfo,
        adultContent
      });
    });
    
    return relatedData;
  } catch (error) {
    console.error('Error extracting related data:', error);
    return [];
  }
}

export async function findTmdbIdForTitle(title = '') {
  try {
    if (!title) {
      console.error('No title provided for TMDB search');
      return null;
    }
    
    const cleanTitle = removeSeasonFromTitle(title);
    const encodedTitle = encodeURIComponent(cleanTitle);
    
    const data = await fetchTmdb(`/search/tv?query=${encodedTitle}&language=en-US&page=1`);
    const results = data.results || [];
    
    const animeResults = results.filter(result => {
      const isJapanese = result.origin_country && result.origin_country.includes('JP');
      const hasAnimationGenre = result.genre_ids && result.genre_ids.includes(16);
      return isJapanese || hasAnimationGenre;
    });
    
    if (animeResults.length > 0) {
      console.log(`Found TMDB match for "${cleanTitle}":`, animeResults[0].name);
      return animeResults[0].id;
    }
    
    if (results.length > 0) {
      console.log(`Found possible TMDB match for "${cleanTitle}":`, results[0].name);
      return results[0].id;
    }
    
    console.log(`No TMDB search results for "${cleanTitle}"`);
    return null;
  } catch (error) {
    console.error('Error finding TMDB ID by title:', error);
    return null;
  }
}

function removeSeasonFromTitle(title) {
  return title.replace(/\s+Season\s+\d+/i, '')
             .replace(/\s+\d+(?:st|nd|rd|th)\s+Season/i, '')
             .trim();
}

export async function findTmdbIdForSeason(seasonName = '') {
  try {
    if (!seasonName) {
      return null;
    }
    
    // Clean the season name for better search results
    const cleanTitle = removeSeasonFromTitle(seasonName);
    const seasonNumber = extractSeasonNumber(seasonName);
    
    console.log(`Searching TMDB for: "${cleanTitle}" (Season ${seasonNumber})`);
    
    const encodedTitle = encodeURIComponent(cleanTitle);
    const data = await fetchTmdb(`/search/tv?query=${encodedTitle}&language=en-US&page=1`);
    const results = data.results || [];
    
    // Filter for anime results
    const animeResults = results.filter(result => {
      const isJapanese = result.origin_country && result.origin_country.includes('JP');
      const hasAnimationGenre = result.genre_ids && result.genre_ids.includes(16);
      return isJapanese || hasAnimationGenre;
    });
    
    let tmdbId = null;
    let matchedResult = null;
    
    if (animeResults.length > 0) {
      matchedResult = animeResults[0];
      tmdbId = matchedResult.id;
      console.log(`Found anime TMDB match for "${cleanTitle}":`, matchedResult.name);
    } else if (results.length > 0) {
      matchedResult = results[0];
      tmdbId = matchedResult.id;
      console.log(`Found possible TMDB match for "${cleanTitle}":`, matchedResult.name);
    }
    
    if (tmdbId) {
      // Try to get season-specific information
      try {
        const seasonData = await fetchTmdb(`/tv/${tmdbId}/season/${seasonNumber}`);
        if (seasonData && seasonData.episodes) {
          console.log(`Found season ${seasonNumber} data for TMDB ID ${tmdbId}`);
          return { 
            tmdbId, 
            seasonNumber,
            seasonData,
            originalTitle: matchedResult.name,
            seasonTitle: seasonData.name || `Season ${seasonNumber}`
          };
        }
      } catch (seasonError) {
        console.warn(`Season ${seasonNumber} not found for TMDB ID ${tmdbId}, using season 1`);
      }
      
      // Fallback to season 1 if specific season not found
      return { 
        tmdbId, 
        seasonNumber: 1,
        originalTitle: matchedResult.name,
        seasonTitle: `Season 1`
      };
    }
    
    console.log(`No TMDB search results for "${cleanTitle}"`);
    return null;
  } catch (error) {
    console.error('Error finding TMDB ID for season:', error);
    return null;
  }
}

export function extractSeasonNumber(seasonName) {
  if (!seasonName) return 1;
  
  const name = seasonName.toLowerCase();
  
  // "{animename} Season {seasonnumber}"
  const pattern1 = /season\s*(\d+)/i;
  const match1 = name.match(pattern1);
  if (match1 && match1[1]) {
    return parseInt(match1[1]);
  }
  
  // "{animename} {seasonnumber}"
  const pattern2 = /\s(\d+)$/;
  const match2 = name.match(pattern2);
  if (match2 && match2[1]) {
    return parseInt(match2[1]);
  }
  
  // "{animename} {seasonnumber}th/st/nd/rd Season"
  const pattern3 = /(\d+)(?:st|nd|rd|th)\s+season/i;
  const match3 = name.match(pattern3);
  if (match3 && match3[1]) {
    return parseInt(match3[1]);
  }
  
  // Default to season 1
  return 1;
}
