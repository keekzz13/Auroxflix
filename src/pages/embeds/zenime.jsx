import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import config from '../../config.json';
import VideoPlayer from '../../components/player/main';
import { extractQualitiesFromM3U8 } from '../../components/player/helpers';

function createProxyHeaders(url) {
  if (!url) return {};
  
  try {
    const urlObj = new URL(url);
    const origin = `${urlObj.protocol}//${urlObj.hostname}`;
    
    return {'Origin': origin, 'Referer': origin + '/'};
  } catch (error) { return {}; }
}

function createProxyUrl(url, headers = {}) {
  if (!url) return '';
  const proxyUrl = config.m3u8proxy;
  
  const encodedUrl = encodeURIComponent(url);
  const encodedHeaders = encodeURIComponent(JSON.stringify(headers));
  
  return `${proxyUrl}/m3u8-proxy?url=${encodedUrl}&headers=${encodedHeaders}`;
}

const Zenime = () => {
  let { episodeId, server, type } = useParams();
  episodeId = decodeURIComponent(episodeId);
  
  const isIframeMode = window.location.search.includes('iframe=1');
  
  const [videoUrl, setVideoUrl] = useState('');
  const [originalM3U8Url, setOriginalM3U8Url] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qualityOptions, setQualityOptions] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [iframeUrl, setIframeUrl] = useState('');
  
  const [showCaptionsPopup, setShowCaptionsPopup] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [availableSubtitles, setAvailableSubtitles] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [subtitlesLoading, setSubtitlesLoading] = useState(false);
  const [subtitleError, setSubtitleError] = useState('');
  const [subtitleCues, setSubtitleCues] = useState([]);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const zenimeResponse = await fetch(config.proxy, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `https://api.zenime.site/api/stream?id=${episodeId}&server=${server}&type=${type}`,
            method: 'GET',
            headers: { 'Origin': 'https://zenime.site' },
          })
        });

        const zenimeData = await zenimeResponse.json();
        
        if (!zenimeData.success || !zenimeData.results) { throw new Error('Failed to load video data'); }
        
        // iframe mode
        if (isIframeMode) {
          if (!zenimeData.results.streamingLink || !zenimeData.results.streamingLink.iframe) {
            throw new Error('Sorry, we couldn\'t find a video');
          }
          
          setIframeUrl(zenimeData.results.streamingLink.iframe);
          setLoading(false);
          return;
        }
        
        if (!zenimeData.results.streamingLink || 
            Array.isArray(zenimeData.results.streamingLink) && zenimeData.results.streamingLink.length === 0 ||
            !zenimeData.results.streamingLink.link) {
          throw new Error('Sorry, we couldn\'t find a video');
        }
        
        const streamData = zenimeData.results.streamingLink;
        let videoSource = streamData.link.file;
        
        setOriginalM3U8Url(videoSource);
        
        const iframeUrl = streamData.iframe || "https://megaplay.buzz/";
        const headers = createProxyHeaders(iframeUrl);
        videoSource = createProxyUrl(videoSource, headers);
        
        setVideoUrl(videoSource);
        
        setSubtitlesLoading(true);
        try {
          const processedSubtitles = streamData.tracks ? await Promise.all(
            streamData.tracks
              .filter(track => track.kind === 'captions' || track.kind === 'subtitles')
              .map(async (track) => {
                try {
                  const subtitleResponse = await fetch(config.proxy, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      url: track.file,
                      method: 'GET',
                      headers: { 'Referer': 'https://megaplay.buzz/' },
                    })
                  });

                  if (!subtitleResponse.ok) {
                    throw new Error(`Failed to fetch subtitle: ${subtitleResponse.status}`);
                  }

                  const subtitleContent = await subtitleResponse.text();
                  
                  return {
                    url: track.file,
                    content: subtitleContent,
                    language: track.label || 'Unknown',
                    lang: track.label || 'Unknown',
                    display: track.label || 'Unknown',
                    default: !!track.default,
                    format: 'vtt'
                  };
                } catch (error) { return null; }
              })
          ).then(results => results.filter(Boolean)) : [];
          
          setAvailableSubtitles(processedSubtitles);
        } catch (err) {
          setSubtitleError(`Failed to load subtitles: ${err.message}`);
          setTimeout(() => setSubtitleError(''), 3000);
        } finally {
          setSubtitlesLoading(false);
        }
        
        try {
          const qualities = await extractQualitiesFromM3U8(videoSource, createProxyUrl, headers);
          
          if (qualities.length > 0) { 
            setQualityOptions(qualities);
            setSelectedQuality(qualities[0]);
          }
          else { 
            setQualityOptions([]);
            setSelectedQuality(null);
          }
        } catch (qualityError) { 
          setQualityOptions([]);
          setSelectedQuality(null);
        }
        
      } catch (err) { setError(err.message || 'Failed to load video'); }
      finally { setLoading(false); }
    };

    if (episodeId && server && type) {
      fetchVideoData();
    }
  }, [episodeId, server, type]);

  const selectSubtitle = async (subtitle, videoRef) => {
    console.log('Selected subtitle:', subtitle);
    setSelectedSubtitle(subtitle);
    
    if (subtitle === null) {
      setSubtitlesEnabled(false);
      setSubtitleCues([]);
    } else {
      setSubtitlesEnabled(true);
      await loadSubtitleCues(subtitle);
    }
  };

  const parseVTT = (vttText) => {
    const lines = vttText.split('\n');
    const cues = [];
    let i = 0;
    
    // Skip WEBVTT header and any initial metadata
    while (i < lines.length && !lines[i].includes('-->')) {
      i++;
    }
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (line.includes('-->')) {
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timeMatch) {
          i++;
          let text = '';
          
          while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
            if (text) text += '\n';
            text += lines[i].trim();
            i++;
          }
          
          if (text) {
            cues.push({
              startTime: timeMatch[1],
              endTime: timeMatch[2],
              text: text
            });
          }
        }
      } else {
        i++;
      }
    }
    
    return cues;
  };

  const loadSubtitleCues = async (subtitle) => {
    if (!subtitle) return;

    try {
      let subtitleText = '';
      
      if (subtitle.content) {
        subtitleText = subtitle.content;
      } else if (subtitle.url) {
        const response = await fetch(config.proxy, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: subtitle.url,
            method: 'GET',
            headers: { 'Referer': 'https://megaplay.buzz/' },
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch subtitle: ${response.status}`);
        }
        
        subtitleText = await response.text();
      } else {
        throw new Error('No subtitle content or URL available');
      }
      
      // Parse VTT and set cues
      const parsedVtt = parseVTT(subtitleText);
      setSubtitleCues(parsedVtt);
      
    } catch (err) {
      console.error('Error loading subtitle cues:', err);
      setSubtitleError(`Failed to load subtitles: ${err.message}`);
      setTimeout(() => setSubtitleError(''), 3000);
      setSubtitleCues([]);
    }
  };

  if (error) {
    return (
      <div 
        className="flex h-screen w-full items-center justify-center text-4xl font-medium tracking-[-0.015em] text-white px-[10%] text-center" 
        style={{fontFamily: 'Inter'}}
      >
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed top-0 left-0 w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading video...</div>
      </div>
    );
  }

  // iframe for iframe mode
  if (isIframeMode && iframeUrl) {
    return (
      <div className="fixed top-0 left-0 w-screen h-screen">
        <iframe
          src={iframeUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="Video Player"
        />
      </div>
    );
  }

  return (
    <VideoPlayer
      videoUrl={videoUrl}
      originalM3U8Url={originalM3U8Url}
      onError={setError}
      showCaptionsPopup={showCaptionsPopup}
      setShowCaptionsPopup={setShowCaptionsPopup}
      subtitlesEnabled={subtitlesEnabled}
      subtitleError={subtitleError}
      subtitlesLoading={subtitlesLoading}
      availableSubtitles={availableSubtitles}
      selectedSubtitle={selectedSubtitle}
      onSelectSubtitle={selectSubtitle}
      subtitleCues={subtitleCues}
      availableQualities={qualityOptions}
      selectedQuality={selectedQuality}
      mediaId={episodeId ? episodeId.split('?')[0] : null}
      mediaType="anime"
      episode={episodeId ? episodeId.split('?')[0] : null}
      sourceIndex={0}
    />
  );
};

export default Zenime;
