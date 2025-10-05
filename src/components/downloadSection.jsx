import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, Play, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAllTorrents, fetchNormalDownloads } from './downloadUtils.jsx';

const DownloadSection = ({ item, mediaType, tmdbId }) => {
  const [torrents, setTorrents] = useState([]);
  const [normalDownloads, setNormalDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState('Initializing...');

  useEffect(() => {
    const fetchDownloads = async () => {
      if (!item || !mediaType || !tmdbId) return;
      
      setIsLoading(true);
      setError(null);
      setLoadingProgress('Initializing...');
      
      try {
        const progressCallback = (message) => setLoadingProgress(message);
        
        const allTorrents = await fetchAllTorrents(mediaType, tmdbId, item, progressCallback);
        setTorrents(allTorrents);
        
        const allNormalDownloads = await fetchNormalDownloads(mediaType, tmdbId, item, progressCallback);
        setNormalDownloads(allNormalDownloads);
        
        setLoadingProgress('Completed!');
      } catch (error) {
        console.error('Error fetching downloads:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDownloads();
  }, [item, mediaType, tmdbId]);

  const handleCopyMagnet = (magnetUrl, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(magnetUrl);
    toast.success('Magnet link copied to clipboard');
  };

  const handleCopyStream = (streamUrl, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(streamUrl);
    toast.success('Stream link copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">Download sources loading...</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-white border-solid border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-300 text-xs">{loadingProgress}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">Download sources couldn't load</h2>
        <div className="text-center py-8 bg-zinc-800 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">Error Loading Downloads</h3>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Normal Downloads</h2>

        {normalDownloads.length > 0 ? (
          <div className="space-y-3">
            {normalDownloads.map((download, index) => (
              <a key={index} href={download.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800/80 border border-white/15 transition-colors cursor-pointer">
                  <div className="flex-grow flex flex-col md:flex-row items-start md:items-center mb-4 md:mb-0">
                    <span className="text-white mb-2 md:mb-0 md:mr-4 font-medium">
                      {download.title}
                    </span>
                    {download.tags && download.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {download.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="text-xs px-2 py-1 bg-white/15 rounded-full text-zinc-200">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">{download.source}</span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => handleCopyStream(download.url, e)} 
                        className="text-zinc-200 hover:text-white bg-white/15 hover:bg-white/25 p-2 rounded transition-colors cursor-pointer" 
                        title="Copy stream link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a 
                        href={download.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-zinc-200 hover:text-white bg-white/15 hover:bg-white/25 p-2 rounded transition-colors cursor-pointer" 
                        title="Open stream link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800/80 border border-white/15 transition-colors cursor-pointer">
            <div className="flex-grow flex flex-col md:flex-row items-start md:items-center mb-4 md:mb-0">
              <span className="text-white mb-2 md:mb-0 md:mr-4 font-medium">
                No normal downloads found
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Torrent Downloads</h2>
        
        {torrents.length > 0 ? (
          <div className="space-y-3">
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-yellow-200 font-medium mb-1">Torrenting Client Required</h3>
                  <p className="text-yellow-200/80 text-sm">
                    To download torrents from QuickWatch, you need a torrenting client installed. We recommend{' '}
                    <a href="https://www.qbittorrent.org/download" className="underline hover:text-yellow-100" target="_blank" rel="noopener noreferrer">qBittorrent</a>
                    , but you can use any client you prefer.
                  </p>
                </div>
              </div>
            </div>
            {torrents.map((torrent, index) => (
              <a key={index} href={torrent.url} target={torrent.source === 'TorrentGalaxy' ? '_blank' : undefined} rel={torrent.source === 'TorrentGalaxy' ? 'noopener noreferrer' : undefined} className="block">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800/80 border border-white/15 transition-colors cursor-pointer">
                  <div className="flex-grow flex flex-col md:flex-row items-start md:items-center mb-4 md:mb-0">
                    <span className="text-white mb-2 md:mb-0 md:mr-4 font-medium">{torrent.title || item.title || item.name}</span>
                    <div className="flex flex-wrap gap-2">
                      {torrent.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="text-xs px-2 py-1 bg-white/15 rounded-full text-zinc-200">{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">{torrent.source}</span>
                    <div className="flex space-x-2">
                      <button onClick={(e) => handleCopyMagnet(torrent.url, e)} className="text-zinc-200 hover:text-white bg-white/15 hover:bg-white/25 p-2 rounded transition-colors cursor-pointer" title="Copy magnet link">
                        <Copy className="w-4 h-4" />
                      </button>
                      <a 
                        href={torrent.url}
                        target={torrent.source === 'TorrentGalaxy' ? '_blank' : undefined}
                        rel={torrent.source === 'TorrentGalaxy' ? 'noopener noreferrer' : undefined}
                        onClick={(e) => e.stopPropagation()}
                        className="text-zinc-200 hover:text-white bg-white/15 hover:bg-white/25 p-2 rounded transition-colors cursor-pointer" 
                        title={torrent.source === 'TorrentGalaxy' ? 'Open website' : 'Open magnet link'}
                      >
                        {torrent.source === 'TorrentGalaxy' ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      </a>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-800 rounded-lg">
            <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-white">No downloads found</h3>
            <p className="text-zinc-400 mb-4">We couldn't find any torrent sources for {item.title || item.name}. Try checking:</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a href={`https://torrentgalaxy.one/get-posts/keywords:${item.imdb_id || ''}/`} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">TorrentGalaxy</a>
              <a href={`https://1337x.pro/search/?q=${encodeURIComponent(item.title || item.name)}`} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">1337x</a>
              <a href={`https://nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(item.title || item.name)}`} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Nyaa.si</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadSection;
