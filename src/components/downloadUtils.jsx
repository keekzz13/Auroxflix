import { fetchTmdb } from '../utils.jsx';
import config from '../config.json';
import { getShowboxDownloadLink } from './downloaders/showbox.jsx';
import { getVegamoviesDownloads } from './downloaders/vegamovies.jsx';

const { baseTrackers } = config;

export const checkAnimeStatus = async (imdbId) => {
  try {
    const animeResponse = await fetch('https://raw.githubusercontent.com/Fribb/anime-lists/refs/heads/master/anime-list-full.json');
    const animeList = await animeResponse.json();
    const animeItem = animeList.find(anime => anime.imdb_id === imdbId);
    
    return { isAnime: !!animeItem, anilistId: animeItem?.anilist_id || null };
  } catch (error) {
    console.warn('Failed to check anime status:', error);
    return { isAnime: false, anilistId: null };
  }
};

export const fetchAnimeTorrents = async (anilistId, mediaTitle) => {
  try {
    const nyaaResponse = await fetch(`https://releases.moe/api/collections/entries/records?filter=alID=${anilistId}&expand=trs`);
    const nyaaData = await nyaaResponse.json();
    
    const torrents = [];
    
    if (nyaaData.items?.[0]?.expand?.trs) {
      nyaaData.items[0].expand.trs.forEach(result => {
        if (result.url.includes('nyaa.si')) {
          const tags = [];
          tags.push(`${result.files.length} Episodes`);
          tags.push(result.updated.split(' ')[0]);
          if (result.dualAudio) tags.push('DualAudio');
          
          const magnetUrl = `magnet:?xt=urn:btih:${result.infoHash}&dn=${encodeURIComponent(`${mediaTitle} (${result.releaseGroup})`)}&${baseTrackers}`;
          torrents.push({ url: magnetUrl, title: `${mediaTitle} (${result.releaseGroup})`, tags, source: 'Nyaa.si' });
        }
      });
    }
    
    return torrents;
  } catch (error) { console.warn('Failed to fetch Nyaa.si data:', error); return []; }
};

export const fetchYtxTorrents = async (imdbId) => {
  try {
    const ytsResponse = await fetch(`https://yts.mx/api/v2/movie_details.json?imdb_id=${imdbId}`);
    const ytsData = await ytsResponse.json();
    
    const torrents = [];
    
    if (ytsData.data?.movie?.torrents) {
      ytsData.data.movie.torrents.forEach(torrent => {
        const magnetUrl = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(ytsData.data.movie.title)}&${baseTrackers}`;
        const formattedDate = torrent.date_uploaded.split(' ')[0];
        
        torrents.push({ url: magnetUrl, title: ytsData.data.movie.title, tags: [torrent.quality, torrent.size, formattedDate], source: 'YTS.MX' });
      });
    }
    
    return torrents;
  } catch (error) { console.warn('Failed to fetch YTS.MX data:', error); return []; }
};

export const fetchPirateBayTorrents = async (mediaTitle, mediaType, proxyUrl) => {
  try {
    const torrents = [];
    const categories = mediaType === 'tv' ? ['205', '208'] : ['201', '207'];
    const qualities = ['SD', 'HD'];
    
    for (let i = 0; i < categories.length; i++) {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `https://1.piratebays.to/s/?q=${encodeURIComponent(mediaTitle)}&video=on&category=${categories[i]}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
          }
        })
      });
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('#searchResult > tbody > tr');
      
      rows.forEach(row => {
        try {
          const magnetLink = row.querySelector('td a[href^="magnet:"]')?.href;
          const titleElem = row.querySelector('td .detLink');
          const dateElem = row.querySelector('td:nth-of-type(3)');
          const sizeElem = row.querySelector('td:nth-of-type(5)');
          
          if (magnetLink && titleElem && dateElem && sizeElem) {
            torrents.push({ url: magnetLink, title: titleElem.textContent.trim(), tags: [qualities[i], dateElem.textContent.trim(), sizeElem.textContent.trim()], source: 'The Pirate Bay'});
          }
        } catch (error) { console.error('Error processing Pirate Bay row:', error); }
      });
    }
    
    return torrents;
  } catch (error) { console.warn('Failed to fetch Pirate Bay data:', error); return []; }
};

export const fetchTorrentGalaxyTorrents = async (imdbId) => {
  try {
    const response = await fetch(`https://torrentgalaxy.one/get-posts/keywords:${imdbId}/`);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const torrents = [];
    
    doc.querySelectorAll('div.tgxtablerow').forEach(row => {
      try {
        const magnetElement = row.querySelector('a i.glyphicon-magnet');
        if (!magnetElement) return;

        const magnetLink = magnetElement.closest('a')?.getAttribute('href');
        const titleElement = row.querySelector('div.tgxtablerow .txlight[title][href]');
        const title = titleElement?.getAttribute('title') || '';
        const size = row.querySelector('div.tgxtablecell span.badge-secondary')?.textContent?.trim().replace('\xa0', ' ');
        
        const dateCells = row.querySelectorAll('div.tgxtablecell');
        const dateCell = dateCells[dateCells.length - 1];
        let dateText = dateCell?.textContent?.trim() || '';
        
        if (dateText.includes('Added')) { dateText = dateText.split('Added')[1].trim(); }

        const today = new Date();
        let estimatedDate = new Date(today);

        // Parse relative date
        if (dateText.includes('year')) { const yearsMatch = dateText.match(/(\d+)\s*year/); if (yearsMatch) estimatedDate.setFullYear(estimatedDate.getFullYear() - parseInt(yearsMatch[1])); }
        if (dateText.includes('month')) { const monthsMatch = dateText.match(/(\d+)\s*month/); if (monthsMatch) estimatedDate.setMonth(estimatedDate.getMonth() - parseInt(monthsMatch[1])); }
        if (dateText.includes('week')) { const weeksMatch = dateText.match(/(\d+)\s*week/); if (weeksMatch) estimatedDate.setDate(estimatedDate.getDate() - (parseInt(weeksMatch[1]) * 7)); }
        if (dateText.includes('day')) { const daysMatch = dateText.match(/(\d+)\s*day/); if (daysMatch) estimatedDate.setDate(estimatedDate.getDate() - parseInt(daysMatch[1])); }
        if (dateText.includes('hour')) { const hoursMatch = dateText.match(/(\d+)\s*hour/); if (hoursMatch) estimatedDate.setHours(estimatedDate.getHours() - parseInt(hoursMatch[1])); }

        const formattedDate = estimatedDate.toISOString().split('T')[0];

        if (magnetLink) {
          const finalUrl = `https://torrentgalaxy.one${magnetLink}`;
          torrents.push({ url: finalUrl, title: title, tags: [formattedDate, size].filter(Boolean), source: 'TorrentGalaxy' });
        }
      } catch (error) { console.warn('Error processing TorrentGalaxy row:', error); }
    });
    
    return torrents;
  } catch (error) { console.warn('Failed to fetch TorrentGalaxy data:', error); return []; }
};

export const fetchShowboxDownload = async (tmdbId, mediaType, title) => {
  try {
    const downloadLink = await getShowboxDownloadLink(tmdbId, mediaType);
    if (downloadLink) { return { url: downloadLink, title: title, source: 'Showbox', type: 'stream', tags: ['⭐ Recommended', 'Multiple qualities'] }; }
    
    return null;
  } catch (error) {
    console.warn('Failed to fetch Showbox download:', error);
    return null;
  }
};

export const fetchTorrentioTorrents = async (imdbId) => {
  try {
    const response = await fetch(`https://torrentio.strem.fun/providers=eztv,rarbg,1337x,kickasstorrents,magnetdl,horriblesubs,nyaasi,tokyotosho,anidex/stream/x/${imdbId}.json`);
    const data = await response.json();
    
    const torrents = [];
    
    if (data.streams) {
      data.streams.forEach(stream => {
        try {
          let cleanTitle = stream.title;
          const thumbsUpIndex = cleanTitle.indexOf('\n👤');
          if (thumbsUpIndex !== -1) { cleanTitle = cleanTitle.substring(0, thumbsUpIndex); }
          
          const tags = [];
          if (stream.behaviorHints?.bingeGroup) {
            const bingeGroup = stream.behaviorHints.bingeGroup;
            const allowedTags = ['144p', '360p', '480p', '720p', '1080p', '1440p', '2160p', '4k', 'BluRay', 'WEB-DL', 'BDRip', 'x265', 'HDR', 'HDR10+', 'x264', 'hevc', 'h265'];
            
            allowedTags.forEach(tag => {
              if (bingeGroup.toLowerCase().includes(tag.toLowerCase())) { tags.push(tag); }
            });
          }
          
          if (stream.infoHash) {
            const magnetUrl = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(cleanTitle)}&${baseTrackers}`;
            
            torrents.push({ url: magnetUrl, title: cleanTitle, tags: tags, source: 'Torrentio' });
          }
        } catch (error) { console.warn('Error processing Torrentio stream:', error); }
      });
    }
    
    return torrents;
  } catch (error) {
    console.warn('Failed to fetch Torrentio data:', error);
    return [];
  }
};

export const fetchAllTorrents = async (mediaType, tmdbId, item, onProgress = null) => {
  try {
    const externalIds = await fetchTmdb(`/${mediaType}/${tmdbId}/external_ids`);
    const imdbId = externalIds.imdb_id;

    if (!imdbId) { throw new Error('IMDB ID not found for this media'); }

    const allTorrents = [];
    const mediaTitle = item.title || item.name;

    // Fetch Anime torrents (for anime)
    try {
      if (onProgress) onProgress('Checking anime status...');
      const { isAnime, anilistId } = await checkAnimeStatus(imdbId);
      console.log('Anime check result:', { isAnime, anilistId });
      if (isAnime && anilistId) {
        if (onProgress) onProgress('Finding Nyaa.si downloads...');
        const animeTorrents = await fetchAnimeTorrents(anilistId, mediaTitle);
        console.log('Anime torrents found:', animeTorrents.length);
        allTorrents.push(...animeTorrents);
      }
    } catch (error) { console.warn('Failed to fetch anime torrents:', error); }

    // Fetch YTS torrents (for movies)
    if (mediaType === 'movie') {
      try {
        if (onProgress) onProgress('Finding YTS.MX downloads...');
        console.log('Fetching YTS torrents for movie:', imdbId);
        const movieTorrents = await fetchYtxTorrents(imdbId);
        console.log('YTS torrents found:', movieTorrents.length);
        allTorrents.push(...movieTorrents);
      } catch (error) { console.warn('Failed to fetch YTS torrents:', error); }
    }

    // Fetch Torrentio torrents
    try {
      if (onProgress) onProgress('Finding Torrentio downloads...');
      console.log('Fetching Torrentio torrents for:', imdbId);
      const torrentioTorrents = await fetchTorrentioTorrents(imdbId);
      console.log('Torrentio torrents found:', torrentioTorrents.length);
      allTorrents.push(...torrentioTorrents);
    } catch (error) { console.warn('Failed to fetch Torrentio torrents:', error); }

    // Fetch TorrentGalaxy torrents
    try {
      if (onProgress) onProgress('Finding TorrentGalaxy downloads...');
      console.log('Fetching TorrentGalaxy torrents for:', imdbId);
      const tgTorrents = await fetchTorrentGalaxyTorrents(imdbId);
      console.log('TorrentGalaxy torrents found:', tgTorrents.length);
      allTorrents.push(...tgTorrents);
    } catch (error) { console.warn('Failed to fetch TorrentGalaxy torrents:', error); }

    // Fetch Pirate Bay torrents
    try {
      const { proxy } = config;
      console.log('Proxy config:', proxy);
      if (proxy) {
        if (onProgress) onProgress('Finding Pirate Bay downloads...');
        console.log('Fetching Pirate Bay torrents for:', mediaTitle);
        const pbTorrents = await fetchPirateBayTorrents(mediaTitle, mediaType, proxy);
        console.log('Pirate Bay torrents found:', pbTorrents.length);
        allTorrents.push(...pbTorrents);
      } else { console.log('No proxy configured, skipping Pirate Bay'); }
    } catch (error) { console.warn('Failed to fetch Pirate Bay torrents:', error); }

    console.log('Total torrents found:', allTorrents.length, allTorrents);
    return allTorrents;
  } catch (error) { console.error('Error fetching torrents:', error); throw error; }
};

export const fetchNormalDownloads = async (mediaType, tmdbId, item, onProgress = null) => {
  try {
    const normalDownloads = [];
    
    // Fetch Showbox download
    try {
      if (onProgress) onProgress('Finding Showbox downloads...');
      const releaseYear = item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || '';
      const showboxDownload = await fetchShowboxDownload(tmdbId, mediaType, `${item.title || item.name} (${releaseYear})`);
      if (showboxDownload) {
        normalDownloads.push(showboxDownload);
      }
    } catch (error) {
      console.warn('Failed to fetch Showbox download:', error);
    }
    
    if (mediaType === 'movie') {
      try {
        if (onProgress) onProgress('Finding Vegamovies downloads...');
        console.log('Fetching Vegamovies downloads for movie:', tmdbId);
        const vegamoviesDownloads = await getVegamoviesDownloads(tmdbId);
        console.log('Vegamovies downloads found:', vegamoviesDownloads.length);
        normalDownloads.push(...vegamoviesDownloads);
      } catch (error) {
        console.warn('Failed to fetch Vegamovies downloads:', error);
      }
    }
    
    return normalDownloads;
  } catch (error) {
    console.error('Error fetching normal downloads:', error);
    return [];
  }
};
