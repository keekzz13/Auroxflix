import * as cheerio from "cheerio";
import config from '../../config.json';

// Cache for anime data to prevent duplicate requests
const animeDataCache = new Map();
const animeInfoCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchAnimeData(category = 'top-airing', page = 1) {
  try {
    // Create cache key
    const cacheKey = `${category}-${page}`;
    
    // Check cache first
    if (animeDataCache.has(cacheKey)) {
      const cached = animeDataCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Returning cached anime data for:', cacheKey);
        return cached.data;
      } else {
        animeDataCache.delete(cacheKey);
      }
    }
    
    const resp = await fetch(config.proxy, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://hianime.nz/${category}?page=${page}`,
        method: 'GET'
      })
    });
    
    const $ = cheerio.load(await resp.text());
    
    // Extract total pages
    let totalPages = 1;
    const lastPage = $('.pre-pagination nav .pagination > .page-item a[title="Last"]');
    const nextPage = $('.pre-pagination nav .pagination > .page-item a[title="Next"]');
    const activePage = $('.pre-pagination nav .pagination > .page-item.active a');
    
    if (lastPage.length && lastPage.attr('href')) {
      const href = lastPage.attr('href');
      totalPages = parseInt(href.split('=').pop()) || 1;
    } else if (nextPage.length && nextPage.attr('href')) {
      const href = nextPage.attr('href');
      totalPages = parseInt(href.split('=').pop()) || 1;
    } else if (activePage.length) {
      totalPages = parseInt(activePage.text().trim()) || 1;
    }
    
    // Extract results
    const elements = $('#main-content .film_list-wrap .flw-item');
    const results = [];
    
    elements.each((_, element) => {
      const $element = $(element);
      
      // Get title, ID, and description
      const filmName = $element.find('.film-detail .film-name .dynamic-name');
      let animeId = null;
      
      if (filmName.length && filmName.attr('href')) {
        const href = filmName.attr('href');
        animeId = href.substring(1).split('?ref=search')[0];
      }
      
      // Get poster
      const poster = $element.find('.film-poster .film-poster-img');
      const posterUrl = poster.attr('data-src')?.trim() || null;
      
      // Get duration
      const duration = $element.find('.film-detail .fd-infor .fdi-item.fdi-duration');
      const durationText = duration.length ? duration.text().trim() : null;
      
      // Get show type
      const showType = $element.find('.film-detail .fd-infor .fdi-item:nth-of-type(1)');
      const showTypeText = showType.length ? showType.text().trim() : 'Unknown';
      
      // Get rating
      const rating = $element.find('.film-poster .tick-rate');
      const ratingText = rating.length ? rating.text().trim() : null;
      
      // Get sub count
      const subElement = $element.find('.film-poster .tick-sub');
      let subCount = null;
      if (subElement.length && subElement.text().trim()) {
        const subText = subElement.text().trim();
        subCount = parseInt(subText.split(' ').pop()) || null;
      }
      // Get dub count
      const dubElement = $element.find('.film-poster .tick-dub');
      let dubCount = null;
      if (dubElement.length && dubElement.text().trim()) {
        const dubText = dubElement.text().trim();
        dubCount = parseInt(dubText.split(' ').pop()) || null;
      }
      
      // Get episode count
      const epsElement = $element.find('.film-poster .tick-eps');
      let epsCount = null;
      if (epsElement.length && epsElement.text().trim()) {
        const epsText = epsElement.text().trim();
        epsCount = parseInt(epsText.split(' ').pop()) || null;
      }
      
      // Get Japanese title
      let japaneseTitle = null;
      if (filmName.length && filmName.attr('data-jname')) {
        japaneseTitle = filmName.attr('data-jname').trim();
      }
      
      // Create result object
      const result = {
        id: animeId,
        title: filmName.length ? filmName.text().trim() : null,
        japanese_title: japaneseTitle,
        poster: posterUrl,
        duration: durationText,
        tvInfo: {
          showType: showTypeText,
          rating: ratingText,
          sub: subCount,
          dub: dubCount,
          eps: epsCount
        }
      };
      
      results.push(result);
    });
    
    const resultData = { totalPages, results };
    
    // Cache the result
    animeDataCache.set(cacheKey, {
      data: resultData,
      timestamp: Date.now()
    });
    
    // Clean old cache entries periodically
    if (animeDataCache.size > 30) {
      const now = Date.now();
      for (const [key, value] of animeDataCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          animeDataCache.delete(key);
        }
      }
    }
    
    return resultData;
  } catch (error) {
    console.error(`Error fetching ${category} anime data:`, error);
    return { totalPages: 0, results: [] };
  }
}

export async function fetchAnimeInfo(id) {
  try {
    // Check cache first
    if (animeInfoCache.has(id)) {
      const cached = animeInfoCache.get(id);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Returning cached anime info for:', id);
        return cached.data;
      } else {
        animeInfoCache.delete(id);
      }
    }
    
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
        
        const anilistResponse = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: anilistQuery,
            variables: { id: anilistId }
          })
        });
        
        const anilistData = await anilistResponse.json();
        if (anilistData.data?.Media?.bannerImage) {
          backdropImage = anilistData.data.Media.bannerImage;
        }
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
    
    const resultData = {
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
    
    // Cache the result
    animeInfoCache.set(id, {
      data: resultData,
      timestamp: Date.now()
    });
    
    // Clean old cache entries periodically
    if (animeInfoCache.size > 20) {
      const now = Date.now();
      for (const [key, value] of animeInfoCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          animeInfoCache.delete(key);
        }
      }
    }
    
    return resultData;
    
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
      const link = el.find('.film-poster a');
      const poster = el.find('.film-poster img');
      const title = el.find('.film-detail .film-name a');
      
      if (link.length && title.length) {
        const href = link.attr('href') || '';
        const id = href.replace(/^\//, '');
        const titleText = title.text().trim();
        const posterSrc = poster.attr('data-src') || poster.attr('src') || '';
        
        recommendedData.push({
          id,
          title: titleText,
          poster: posterSrc
        });
      }
    });
    
    return recommendedData;
  } catch (error) {
    console.error('Error extracting recommended data:', error);
    return [];
  }
}

function extractRelatedData($) {
  try {
    const relatedItems = $('.cbox.r-related .cbox-content .cbox-flex .ani-list-slide .swiper-slide .ails-wrap');
    const relatedData = [];
    
    relatedItems.each((_, element) => {
      const el = $(element);
      const link = el.find('.film-poster a');
      const poster = el.find('.film-poster img');
      const title = el.find('.film-detail .film-name a');
      
      if (link.length && title.length) {
        const href = link.attr('href') || '';
        const id = href.replace(/^\//, '');
        const titleText = title.text().trim();
        const posterSrc = poster.attr('data-src') || poster.attr('src') || '';
        
        relatedData.push({
          id,
          title: titleText,
          poster: posterSrc
        });
      }
    });
    
    return relatedData;
  } catch (error) {
    console.error('Error extracting related data:', error);
    return [];
  }
}

export async function fetchEpisodesList(id, v1_base_url = "hianime.nz") {
  try {
    const showId = id.split("-").pop();
    const seasonMatch = id.match(/season-(\d+)/);
    const season = seasonMatch ? seasonMatch[1] : '1';
    
    const url = `https://hianime.nz/ajax/v2/episode/list/${showId}`;
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
      "Referer": `https://${v1_base_url}/watch/${id}`
    };

    const response = await fetch(config.proxy, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        method: 'GET',
        headers
      })
    });

    const data = await response.json();
    
    if (!data.html) {
      return { totalEpisodes: 0, episodes: [] };
    }

    const $ = cheerio.load(data.html);
    const episodeLinks = $('.detail-infor-content .ss-list a');
    
    const result = {
      totalEpisodes: episodeLinks.length,
      episodes: []
    };

    episodeLinks.each((_, el) => {
      const element = $(el);
      const episodeNo = parseInt(element.attr('data-number') || '0');
      const href = element.attr('href') || '';
      const epId = href ? href.split('/').pop() : null;
      const title = element.attr('title') ? element.attr('title').trim() : null;
      
      const japaneseTitle = element.find('.ep-name').attr('data-jname') || null;
      const filler = element.attr('class') ? element.attr('class').includes('ssl-item-filler') : false;
      
      result.episodes.push({
        episode_no: episodeNo,
        id: epId,
        epid: epId.includes('?ep=') ? epId.split('?ep=')[1] : epId,
        tmdbid: null,
        season: season,
        episodeid: `${epId}_s${season}`, 
        title,
        japanese_title: japaneseTitle,
        description: null,
        filler
      });
    });

    return result;
  } catch (error) {
    console.error('Error extracting episodes list:', error);
    return { totalEpisodes: 0, episodes: [] };
  }
}
