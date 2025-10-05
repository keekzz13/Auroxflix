import * as cheerio from "cheerio";
import config from '../../config.json';

// Cache for search results to prevent duplicate requests
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function searchAnime(query, page = 1) {
  try {
    if (!query || query.trim() === "") {
      return { totalPages: 0, results: [] };
    }
    
    // Create cache key
    const cacheKey = `${query.trim()}-${page}`;
    
    // Check cache first
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Returning cached search results for:', cacheKey);
        return cached.data;
      } else {
        searchCache.delete(cacheKey);
      }
    }
    
    const encodedQuery = encodeURIComponent(query.trim());
    const resp = await fetch(config.proxy, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://hianime.nz/search?keyword=${encodedQuery}&page=${page}`,
        method: 'GET'
      })
    });
    
    const response = resp;
    const $ = cheerio.load(await response.text());
    
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
    
    const elements = $('#main-content .film_list-wrap .flw-item');
    const results = [];
    
    elements.each((_, element) => {
      const $element = $(element);
      
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
    searchCache.set(cacheKey, {
      data: resultData,
      timestamp: Date.now()
    });
    
    // Clean old cache entries periodically
    if (searchCache.size > 50) {
      const now = Date.now();
      for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          searchCache.delete(key);
        }
      }
    }
    
    return resultData;
  } catch (error) {
    console.error(`Error searching for anime "${query}":`, error);
    return { totalPages: 0, results: [] };
  }
}

export function renderSearchResults(results) {
  if (!results || !results.length) {
    return `<div class="flex items-center justify-center p-4">
      <p class="text-white opacity-60">No results found</p>
    </div>`;
  }
  
  return `
    <div class="flex flex-col space-y-2 p-3">
      ${results.map(anime => renderSearchResultItem(anime)).join('')}
    </div>
  `;
}

function renderSearchResultItem(anime) {
  if (!anime || !anime.id) return '';
  
  const posterUrl = anime.poster || `https://placehold.co/60x90/141414/fff/?text=${encodeURIComponent(anime.title || 'Unknown')}&font=poppins`;
  
  const tags = [];
  
  // Add show type tag
  if (anime.tvInfo.showType) {
    tags.push(`
      <span class="text-xs bg-anime-badge-bg border border-anime-badge-border px-1 py-0.5 rounded-md hover:bg-white hover:text-anime-badge-bg transition duration-200 ease cursor-pointer">
        ${anime.tvInfo.showType}
      </span>
    `);
  }
  
  // Add rating tag
  if (anime.tvInfo.rating) {
    tags.push(`
      <span class="text-xs bg-anime-badge-bg border border-anime-badge-border px-1.5 py-0.5 rounded-md hover:bg-white hover:text-anime-badge-bg transition duration-200 ease cursor-pointer">
        ★ ${anime.tvInfo.rating}
      </span>
    `);
  }
  
  // Add sub count
  if (anime.tvInfo.sub) {
    tags.push(`
      <span class="text-xs bg-anime-badge-bg border border-anime-badge-border px-1.5 py-0.5 rounded-md group hover:bg-white hover:text-anime-badge-bg transition duration-200 ease cursor-pointer">
        <span class="bg-white text-black px-1 rounded-sm mr-1">SUB</span>
        ${anime.tvInfo.sub}
      </span>
    `);
  }
  
  // Add dub count
  if (anime.tvInfo.dub) {
    tags.push(`
      <span class="text-xs bg-anime-badge-bg border border-anime-badge-border px-1.5 py-0.5 rounded-md group hover:bg-white hover:text-anime-badge-bg transition duration-200 ease cursor-pointer">
        <span class="bg-white text-black px-1 rounded-sm mr-1">DUB</span>
        ${anime.tvInfo.dub}
      </span>
    `);
  }
  
  // Add episode count
  if (anime.tvInfo.eps) {
    tags.push(`
      <span class="text-xs bg-anime-badge-bg border border-anime-badge-border px-1.5 py-0.5 rounded-md hover:bg-white hover:text-anime-badge-bg transition duration-200 ease cursor-pointer">
        ${anime.tvInfo.eps} Episodes
      </span>
    `);
  }
  
  // Add duration
  if (anime.duration) {
    tags.push(`
      <span class="text-xs bg-anime-badge-bg border border-anime-badge-border px-1.5 py-0.5 rounded-md hover:bg-white hover:text-anime-badge-bg transition duration-200 ease cursor-pointer">
        ${anime.duration}
      </span>
    `);
  }
  
  const tagsHTML = tags.join('');
  
  // Return the complete result item
  return `
    <div class="anime-card bg-anime-card-bg border border-anime-border/10 rounded-lg overflow-hidden hover:bg-anime-skeleton-bg transition duration-200 ease cursor-pointer" data-id="${anime.id}">
      <div class="flex items-center p-3">
        <div class="w-16 h-24 min-w-[4rem] mr-4">
          <img src="${posterUrl}" alt="${anime.title || 'Anime'}" class="w-full h-full object-cover rounded-md">
        </div>
        <div class="flex flex-col flex-grow">
          <h3 class="font-semibold mb-1 text-white">${anime.title || 'Unknown Anime'}</h3>
          ${anime.japanese_title ? `<p class="text-xs text-white/50 mb-2">${anime.japanese_title}</p>` : ''}
          <div class="flex flex-wrap gap-1 mt-1">
            ${tagsHTML}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderSearchUI() {
  return `
    <div class="search-container pt-20 pb-8 px-4 w-full max-w-7xl mx-auto">
      <div id="search-results" class="min-h-[50vh]">
        <!-- Search results will be loaded here -->
        <div class="flex items-center justify-center p-8">
          <p class="text-white opacity-60">Enter your search query above</p>
        </div>
      </div>
      
      <div id="search-pagination" class="mt-8 flex justify-center">
        <!-- Pagination controls will be loaded here -->
      </div>
    </div>
  `;
}

export function renderPagination(currentPage, totalPages, query) {
  if (totalPages <= 1) return '';
  
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
  let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(endPage - maxVisiblePages + 1, 1);
  }
  
  // Previous button
  if (currentPage > 1) {
    pages.push(`
      <button data-page="${currentPage - 1}" data-query="${query}" class="bg-anime-card-bg border border-anime-border/10 rounded-md px-3 py-1 hover:bg-[#1f1f1f] transition-colors">
        &laquo;
      </button>
    `);
  }
  
  // First page
  if (startPage > 1) {
    pages.push(`
      <button data-page="1" data-query="${query}" class="bg-anime-card-bg border border-anime-border/10 rounded-md px-3 py-1 hover:bg-[#1f1f1f] transition-colors">
        1
      </button>
    `);
    
    if (startPage > 2) {
      pages.push('<span class="px-2">...</span>');
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    pages.push(`
      <button data-page="${i}" data-query="${query}" 
        class="border rounded-md px-3 py-1 transition-colors ${
          isActive 
            ? 'bg-accent text-white border-accent' 
            : 'bg-anime-card-bg border-anime-border/10 hover:bg-[#1f1f1f]'
        }">
        ${i}
      </button>
    `);
  }
  
  // Last page (if not included in the range)
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push('<span class="px-2">...</span>');
    }
    
    pages.push(`
      <button data-page="${totalPages}" data-query="${query}" class="bg-anime-card-bg border border-anime-border/10 rounded-md px-3 py-1 hover:bg-[#1f1f1f] transition-colors">
        ${totalPages}
      </button>
    `);
  }
  
  // Next button
  if (currentPage < totalPages) {
    pages.push(`
      <button data-page="${currentPage + 1}" data-query="${query}" class="bg-anime-card-bg border border-anime-border/10 rounded-md px-3 py-1 hover:bg-[#1f1f1f] transition-colors">
        &raquo;
      </button>
    `);
  }
  
  return `
    <div class="flex space-x-2 items-center text-white">
      ${pages.join('')}
    </div>
  `;
}
