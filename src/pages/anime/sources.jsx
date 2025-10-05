// Anime Sources

export const animeSources = [
  {
    id: 'zenime-1',
    name: 'hd-1',
    subUrl: '/e/zenime/{urlepisodeId}/hd-1/sub',
    dubUrl: '/e/zenime/{urlepisodeId}/hd-1/dub'
  },
  {
    id: 'zenime-2',
    name: 'hd-2',
    subUrl: '/e/zenime/{urlepisodeId}/hd-2/sub',
    dubUrl: '/e/zenime/{urlepisodeId}/hd-2/dub'
  },
  {
    id: 'zenime-3',
    name: 'hd-3',
    subUrl: '/e/zenime/{urlepisodeId}/hd-3/sub',
    dubUrl: '/e/zenime/{urlepisodeId}/hd-3/dub'
  },
  {
    id: 'vidstreaming',
    name: 'vidstream',
    subUrl: '/e/zenime/{urlepisodeId}/vidstreaming/sub?iframe=1',
    dubUrl: '/e/zenime/{urlepisodeId}/vidstreaming/dub?iframe=1'
  },
  {
    id: 'megaplaybz-1',
    name: 'vidplay',
    subUrl: 'https://megaplay.buzz/stream/s-2/{epid}/sub',
    dubUrl: 'https://megaplay.buzz/stream/s-2/{epid}/dub'
  },
];

export function getSourceUrl(sourceId, language, episodeData, animeData) {
  const source = animeSources.find(src => src.id === sourceId);
  if (!source) return 'about:blank';

  const template = language === 'dub' ? source.dubUrl : source.subUrl;

  if (animeData.tmdbId) {
    console.log('Using TMDB ID:', animeData.tmdbId);
  }

  return template
    .replace('{epid}',        episodeData.epid)
    .replace('{episodeId}',   episodeData.episodeid || episodeData.epid || '')
    .replace('{urlepisodeId}', encodeURIComponent(episodeData.episodeid || ''))
    .replace('{tmdbId}',      animeData.tmdbId || '')
    .replace('{season}',      animeData.season   || '1')
    .replace('{episode}',     episodeData.episode_no)
    .replace('{name}',     encodeURIComponent(animeData.name || animeData.title || ''));
}

export function getDefaultSource() {
  return animeSources[0];
}
