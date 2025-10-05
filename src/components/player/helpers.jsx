// src/components/player/helpers.jsx

import { saveProgress } from '../../utils.jsx';

/* ========================== TIME UTILS ========================== */

export const formatTime = (time) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

/* ========================== HLS HELPERS ========================== */

// Treat anything containing "m3u8" as HLS
const isHlsUrl = (url) => typeof url === 'string' && /m3u8/i.test(url);

// If you use a proxy, it should return a proper https URL that the browser can fetch,
// not a blob. If you need to add query params/headers, do it on the server.
// This helper lets you normalize/whitelist any “m3u8-proxy” style URLs to real HTTPS.
const normalizeHlsUrl = (url) => {
  // Example: turn /api/m3u8-proxy?src=... into a stable https URL served by your backend.
  // If your url is already https, just return it.
  return url;
};

// Optional: headers you want on XHR (CORS must allow them server-side)
const defaultHlsHeaders = {
  Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, text/plain',
};

/* ========================== OPTIONAL: M3U8 PARSER ========================== */

export const extractQualitiesFromM3U8 = async (m3u8Url, createProxyUrl, headers = {}) => {
  try {
    console.log('Fetching M3U8 from:', m3u8Url);
    const response = await fetch(m3u8Url);
    const m3u8Text = await response.text();
    console.log('M3U8 content preview:', m3u8Text.substring(0, 500));

    const qualities = [];
    const lines = m3u8Text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        const resolutionMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
        const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
        const frameRateMatch = line.match(/FRAME-RATE=([\d.]+)/);

        // next non-empty, non-comment line = URL
        let url = null;
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.startsWith('#')) {
            url = nextLine;
            break;
          }
        }

        if (resolutionMatch && url) {
          const width = parseInt(resolutionMatch[1], 10);
          const height = parseInt(resolutionMatch[2], 10);
          const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1], 10) : 0;
          const frameRate = frameRateMatch ? parseFloat(frameRateMatch[1]) : null;

          let finalUrl = url;

          if (!/^https?:\/\//i.test(url)) {
            const baseUrl = m3u8Url.split('/').slice(0, -1).join('/');
            const fullUrl = `${baseUrl}/${url}`;
            finalUrl = createProxyUrl ? createProxyUrl(fullUrl, headers) : fullUrl;
          } else if (createProxyUrl) {
            finalUrl = createProxyUrl(url, headers);
          }

          qualities.push({
            index: qualities.length,
            width,
            height,
            bitrate: bandwidth,
            frameRate,
            quality: `${height}p`,
            name: `${height}p`,
            url: finalUrl,
          });

          console.log(`Found quality: ${height}p (${width}x${height}) - ${finalUrl}`);
        }
      }
    }

    qualities.sort((a, b) => b.height - a.height);

    console.log('Final extracted qualities:', qualities);
    return qualities;
  } catch (error) {
    console.error('Error extracting qualities from M3U8:', error);
    return [];
  }
};

/* ========================== PLAYER INIT ========================== */

export const initializeVideo = async (videoUrl, videoRef, hlsRef, setError, setAvailableQualities) => {
  if (!videoUrl || !videoRef.current) return;

  try {
    const video = videoRef.current;

    if (isHlsUrl(videoUrl)) {
      const src = normalizeHlsUrl(videoUrl);
      const { default: Hls } = await import('hls.js');

      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxFragLookUpTolerance: 0.25,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: Infinity,
          liveDurationInfinity: false,
          enableSoftwareAES: true,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 1,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 10000,
          levelLoadingMaxRetry: 4,
          levelLoadingRetryDelay: 1000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 1000,
          startFragPrefetch: true,
          testBandwidth: true,
          // Ensure we never try to XHR blob: URLs, and add headers if needed
          xhrSetup: (xhr) => {
            Object.entries(defaultHlsHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
            // If you need credentials/cookies, uncomment:
            // xhr.withCredentials = true;
          },
        });

        hlsRef.current = hls;

        hls.on(Hls.Events.ERROR, (_evt, data) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad(); // retry network
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError('Fatal error occurred during video playback');
                hls.destroy();
                hlsRef.current = null;
                break;
            }
          }
        });

        // Extract quality levels from manifest
        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          if (setAvailableQualities && data.levels) {
            const qualities = data.levels.map((level, index) => ({
              index,
              height: level.height,
              width: level.width,
              bitrate: level.bitrate,
              quality: level.height ? `${level.height}p` : 'Unknown',
              name: level.height ? `${level.height}p` : 'Unknown',
              url: src,
            }));
            qualities.sort((a, b) => (b.height || 0) - (a.height || 0));
            setAvailableQualities(qualities);
          }
        });

        // Important: pass a real HTTPS URL (no blob)
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS: also use the real HTTP(S) URL, not blobs
        video.src = normalizeHlsUrl(videoUrl);
        if (setAvailableQualities) setAvailableQualities([]);
      } else {
        setError('HLS is not supported in this browser');
      }
    } else {
      // Progressive file
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;

      const handleLoadedMetadata = () => {
        video.preload = 'auto';
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);

      if (setAvailableQualities) {
        setAvailableQualities([]);
      }
    }
  } catch (err) {
    console.error('Error loading video:', err);
    setError('Failed to initialize video player');
  }
};

/* ========================== EVENTS / CONTROLS ========================== */

export const setupVideoEventListeners = (
  videoRef,
  setCurrentTime,
  setDuration,
  setIsPlaying,
  setVolume,
  setIsMuted,
  setIsPictureInPicture,
  setBufferedAmount
) => {
  const video = videoRef.current;
  if (!video) return null;

  const handleTimeUpdate = () => setCurrentTime(video.currentTime);
  const handleDurationChange = () => setDuration(video.duration);
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleVolumeChange = () => {
    setVolume(video.volume);
    setIsMuted(video.muted);
  };
  const handleEnterpictureinpicture = () => setIsPictureInPicture(true);
  const handleLeavepictureinpicture = () => setIsPictureInPicture(false);
  const handleProgress = () => {
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const duration = video.duration;
      if (duration > 0) {
        setBufferedAmount((bufferedEnd / duration) * 100);
      }
    }
  };

  video.addEventListener('timeupdate', handleTimeUpdate);
  video.addEventListener('durationchange', handleDurationChange);
  video.addEventListener('play', handlePlay);
  video.addEventListener('pause', handlePause);
  video.addEventListener('volumechange', handleVolumeChange);
  video.addEventListener('enterpictureinpicture', handleEnterpictureinpicture);
  video.addEventListener('leavepictureinpicture', handleLeavepictureinpicture);
  video.addEventListener('progress', handleProgress);

  return () => {
    video.removeEventListener('timeupdate', handleTimeUpdate);
    video.removeEventListener('durationchange', handleDurationChange);
    video.removeEventListener('play', handlePlay);
    video.removeEventListener('pause', handlePause);
    video.removeEventListener('volumechange', handleVolumeChange);
    video.removeEventListener('enterpictureinpicture', handleEnterpictureinpicture);
    video.removeEventListener('leavepictureinpicture', handleLeavepictureinpicture);
    video.removeEventListener('progress', handleProgress);
  };
};

export const handleSeek = (e, videoRef, duration, progressBarRef) => {
  if (videoRef.current && duration && progressBarRef.current) {
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
  }
};

export const skipTime = (seconds, videoRef) => {
  if (videoRef.current) {
    videoRef.current.currentTime += seconds;
  }
};

export const togglePlay = (isPlaying, videoRef) => {
  if (videoRef.current) {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }
};

export const toggleMute = (videoRef) => {
  if (videoRef.current) {
    videoRef.current.muted = !videoRef.current.muted;
  }
};

export const handleVolumeChange = (e, videoRef) => {
  const newVolume = parseFloat(e.target.value);
  if (videoRef.current) {
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
  }
};

export const toggleFullscreen = (playerRef, setIsFullscreen) => {
  if (!document.fullscreenElement) {
    playerRef.current?.requestFullscreen();
    setIsFullscreen(true);
  } else {
    document.exitFullscreen();
    setIsFullscreen(false);
  }
};

export const togglePictureInPicture = (videoRef, isPictureInPicture) => {
  if (videoRef.current && document.pictureInPictureEnabled) {
    if (isPictureInPicture) {
      document.exitPictureInPicture();
    } else {
      videoRef.current.requestPictureInPicture();
    }
  }
};

export const showControlsTemporarily = (setShowControls, controlsTimeoutRef, isPlaying) => {
  setShowControls(true);
  if (controlsTimeoutRef.current) {
    clearTimeout(controlsTimeoutRef.current);
  }
  controlsTimeoutRef.current = setTimeout(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, 3000);
};

export const parseTimeToSeconds = (timeString) => {
  const [hours, minutes, seconds] = timeString.split(':');
  const [secs, millisecs] = seconds.split(/[,.]/);
  return (
    parseInt(hours || 0, 10) * 3600 +
    parseInt(minutes || 0, 10) * 60 +
    parseInt(secs || 0, 10) +
    (parseInt(millisecs || 0, 10) / 1000)
  );
};

export const changePlaybackSpeed = (speed, videoRef) => {
  if (videoRef.current) {
    videoRef.current.playbackRate = speed;
  }
};

/* ========================== QUALITY SWITCH ========================== */

export const changeQuality = async (quality, hlsRef, videoRef, currentTime) => {
  if (!quality || !videoRef.current) return;

  const preserveTime = currentTime || 0;
  const preservePlayState = videoRef.current && !videoRef.current.paused;

  // If using Hls.js and a level index is available, let Hls.js handle it
  if (hlsRef.current && quality.index !== -1 && quality.index !== undefined) {
    const hls = hlsRef.current;
    hls.currentLevel = quality.index;

    if (preserveTime > 0) {
      const handleLoadedData = () => {
        videoRef.current.currentTime = preserveTime;
        if (preservePlayState) {
          videoRef.current.play().catch(console.error);
        }
        videoRef.current.removeEventListener('loadeddata', handleLoadedData);
      };
      videoRef.current.addEventListener('loadeddata', handleLoadedData);
    }
  } else if (quality.url && quality.url !== videoRef.current.src) {
    // Reload the source with a proper HTTP(S) URL (no blobs)
    const newSrc = normalizeHlsUrl(quality.url);

    const handleLoadedData = () => {
      if (preserveTime > 0) videoRef.current.currentTime = preserveTime;
      if (preservePlayState) {
        videoRef.current.play().catch(console.error);
      }
      videoRef.current.removeEventListener('loadeddata', handleLoadedData);
    };
    videoRef.current.addEventListener('loadeddata', handleLoadedData);

    if (hlsRef.current && isHlsUrl(newSrc)) {
      hlsRef.current.loadSource(newSrc);
    } else {
      // Native HLS or progressive
      videoRef.current.src = newSrc;
    }
  }
};

/* ========================== PROGRESS PERSISTENCE ========================== */

function bindProgressPersistence(videoRef, meta) {
  const video = videoRef.current;
  if (!video) return () => {};

  const state = {
    lastFlushTs: 0,
    intervalId: null,
    destroyed: false,
  };

  const flush = async (force = false) => {
    if (!video || state.destroyed) return;
    const now = Date.now();
    if (!force && now - state.lastFlushTs < 9500) return; // throttle ~10s

    const payload = {
      id: meta?.id ?? null,
      mediaType: meta?.mediaType ?? 'movie',
      season: meta?.season ?? 0,
      episode: meta?.episode ?? 0,
      sourceIndex: meta?.sourceIndex ?? 0,
      fullDuration: Math.max(0, Math.floor(video.duration || 0)),
      watchedDuration: Math.max(0, Math.floor(video.currentTime || 0)),
      timestamp: now,
    };

    try {
      await saveProgress(payload);
      state.lastFlushTs = now;
    } catch (e) {
      console.warn('saveProgress failed:', e);
    }
  };

  const onPause = () => flush(true);
  const onEnded = () => flush(true);
  const onVisibilityChange = () => {
    if (document.hidden) flush(true);
  };
  const onBeforeUnload = () => {
    flush(true);
  };

  video.addEventListener('pause', onPause);
  video.addEventListener('ended', onEnded);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('beforeunload', onBeforeUnload);

  // periodic save
  state.intervalId = setInterval(() => flush(false), 10000);

  // initial prime (after metadata known)
  const onLoadedMetadata = () => flush(true);
  video.addEventListener('loadedmetadata', onLoadedMetadata);

  // cleanup
  return () => {
    state.destroyed = true;
    if (state.intervalId) clearInterval(state.intervalId);
    video.removeEventListener('pause', onPause);
    video.removeEventListener('ended', onEnded);
    video.removeEventListener('loadedmetadata', onLoadedMetadata);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('beforeunload', onBeforeUnload);
  };
}

export const attachProgressTracking = (videoRef, meta) => {
  return bindProgressPersistence(videoRef, meta);
};
