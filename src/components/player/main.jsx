// src/components/player/main.jsx

import React, { useEffect, useState, useRef } from 'react';
import PlayerTemplate from './template';
import {
  initializeVideo,
  setupVideoEventListeners,
  handleSeek,
  skipTime,
  togglePlay,
  toggleMute,
  handleVolumeChange,
  toggleFullscreen,
  togglePictureInPicture,
  showControlsTemporarily,
  parseTimeToSeconds,
  changePlaybackSpeed,
  changeQuality,
} from './helpers';
import { getProgressForItem } from '../../utils.jsx';
import { isMobileDevice } from '../../utils';

const VideoPlayer = ({
  videoUrl,
  onError,

  showCaptionsPopup,
  setShowCaptionsPopup,
  subtitlesEnabled,
  subtitleError,
  subtitlesLoading,
  availableSubtitles,
  selectedSubtitle,
  onSelectSubtitle,
  subtitleCues,

  availableQualities: externalQualities,
  selectedQuality: externalSelectedQuality,
  onQualityChange: externalOnQualityChange,

  mediaId,
  mediaType,
  season = 0,
  episode = 0,

  sourceIndex = 0,
  usedSource,
  manualSourceOverride,
  setManualSourceOverride,
}) => {
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [bufferedAmount, setBufferedAmount] = useState(0);
  const [isProgressHovered, setIsProgressHovered] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Volume slider state
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);

  // Subtitle state
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');

  // Subtitle settings state
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: 18,
    delay: 0,
    position: 'center',
  });

  // Settings state
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [qualitiesLoading, setQualitiesLoading] = useState(false);
  const [volumeBoost, setVolumeBoost] = useState(0);

  // Source management state
  const [showSourcesPopup, setShowSourcesPopup] = useState(false);

  // Progress tracking state
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeTimeoutRef = useRef(null);
  const volumeSliderRef = useRef(null);

  // Web Audio API refs for volume boost
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Load saved progress from Supabase/localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mediaId && mediaType) {
        try {
          const existing = await getProgressForItem({
            id: Number(mediaId),
            mediaType,
            season: Number(season),
            episode: Number(episode),
            sourceIndex: Number(sourceIndex),
          });
          if (!cancelled) {
            setSavedProgress(existing || null);
            setProgressLoaded(false);
            if (existing) {
              console.log('Loaded saved progress:', existing);
            }
          }
        } catch (e) {
          console.warn('Failed to load saved progress:', e);
          if (!cancelled) {
            setSavedProgress(null);
            setProgressLoaded(true);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mediaId, mediaType, season, episode, sourceIndex]);

  // Restore position once the video can report duration/currentTime
  useEffect(() => {
    if (!videoRef.current) return;

    if (!progressLoaded && savedProgress && savedProgress.watchedDuration > 0) {
      const restorePosition = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.duration > 0 && v.readyState >= 2) {
          const targetTime = savedProgress.watchedDuration;
          console.log(`Restoring video position to: ${targetTime} seconds`);
          v.currentTime = targetTime;
          setProgressLoaded(true);

          v.removeEventListener('loadedmetadata', restorePosition);
          v.removeEventListener('loadeddata', restorePosition);
          v.removeEventListener('canplay', restorePosition);
          v.removeEventListener('canplaythrough', restorePosition);
        }
      };

      // Try now, or wait for readiness
      const v = videoRef.current;
      if (v.duration > 0 && v.readyState >= 2) {
        restorePosition();
      } else {
        v.addEventListener('loadedmetadata', restorePosition);
        v.addEventListener('loadeddata', restorePosition);
        v.addEventListener('canplay', restorePosition);
        v.addEventListener('canplaythrough', restorePosition);
      }

      // Cleanup
      return () => {
        const vv = videoRef.current;
        if (vv) {
          vv.removeEventListener('loadedmetadata', restorePosition);
          vv.removeEventListener('loadeddata', restorePosition);
          vv.removeEventListener('canplay', restorePosition);
          vv.removeEventListener('canplaythrough', restorePosition);
        }
      };
    } else if (!savedProgress || savedProgress.watchedDuration <= 0) {
      setProgressLoaded(true);
    }
  }, [savedProgress, progressLoaded, videoUrl]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        gainNodeRef.current = null;
        sourceNodeRef.current = null;
      }
    };
  }, []);

  // Initialize video when videoUrl changes
  useEffect(() => {
    setIsVideoLoading(true);
    if (videoUrl) {
      setQualitiesLoading(true);
      initializeVideo(videoUrl, videoRef, hlsRef, onError, setAvailableQualities);
      setQualitiesLoading(false);
      setProgressLoaded(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, onError]);

  useEffect(() => {
    const cleanup = setupVideoEventListeners(
      videoRef,
      setCurrentTime,
      setDuration,
      setIsPlaying,
      setVolume,
      setIsMuted,
      setIsPictureInPicture,
      setBufferedAmount
    );

    const handleCanPlay = () => {
      setIsVideoLoading(false);
      setupAudioContext();
    };
    const handleWaiting = () => { setIsVideoLoading(true); };
    const handleLoadStart = () => { setIsVideoLoading(true); };
    const handleSeeking = () => { setIsVideoLoading(true); };
    const handleSeeked = () => { setIsVideoLoading(false); };

    // Optimize buffering for partial content
    const handleProgressBuffered = () => {
      if (videoRef.current && videoRef.current.buffered.length > 0) {
        const buffered = videoRef.current.buffered;
        const ct = videoRef.current.currentTime;

        let bufferedEnd = 0;
        for (let i = 0; i < buffered.length; i++) {
          if (buffered.start(i) <= ct && buffered.end(i) > ct) {
            bufferedEnd = buffered.end(i);
            break;
          }
        }

        if (bufferedEnd === 0 && buffered.length > 0) {
          bufferedEnd = buffered.end(buffered.length - 1);
        }

        const dur = videoRef.current.duration;
        if (dur > 0) {
          setBufferedAmount((bufferedEnd / dur) * 100);
        }
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('canplay', handleCanPlay);
      videoRef.current.addEventListener('waiting', handleWaiting);
      videoRef.current.addEventListener('loadstart', handleLoadStart);
      videoRef.current.addEventListener('seeking', handleSeeking);
      videoRef.current.addEventListener('seeked', handleSeeked);
      videoRef.current.addEventListener('progress', handleProgressBuffered);
    }

    return () => {
      cleanup && cleanup();
      if (videoRef.current) {
        videoRef.current.removeEventListener('canplay', handleCanPlay);
        videoRef.current.removeEventListener('waiting', handleWaiting);
        videoRef.current.removeEventListener('loadstart', handleLoadStart);
        videoRef.current.removeEventListener('seeking', handleSeeking);
        videoRef.current.removeEventListener('seeked', handleSeeked);
        videoRef.current.removeEventListener('progress', handleProgressBuffered);
      }
    };
  }, [videoUrl]);

  // Use external qualities if provided, otherwise use internal ones
  const finalAvailableQualities = externalQualities || availableQualities;
  const finalSelectedQuality = externalSelectedQuality || selectedQuality;

  useEffect(() => {
    if (availableQualities.length > 0 && !selectedQuality && !externalQualities) {
      setSelectedQuality(availableQualities[0]);
    }
  }, [availableQualities, selectedQuality, externalQualities]);

  useEffect(() => {
    if (externalSelectedQuality && externalSelectedQuality !== selectedQuality) {
      setSelectedQuality(externalSelectedQuality);
    }
  }, [externalSelectedQuality, selectedQuality]);

  useEffect(() => {
    // Only show custom subtitles on non-mobile devices
    if (isMobileDevice()) {
      setCurrentSubtitleText('');
      return;
    }

    if (!subtitlesEnabled || !selectedSubtitle || !subtitleCues || subtitleCues.length === 0) {
      setCurrentSubtitleText('');
      return;
    }

    const adjustedTime = currentTime - subtitleSettings.delay;

    const currentCue = subtitleCues.find((cue) => {
      const startTime = parseTimeToSeconds(cue.startTime);
      const endTime = parseTimeToSeconds(cue.endTime);
      return adjustedTime >= startTime && adjustedTime <= endTime;
    });

    setCurrentSubtitleText(currentCue ? currentCue.text : '');
  }, [currentTime, subtitlesEnabled, selectedSubtitle, subtitleCues, subtitleSettings.delay]);

  useEffect(() => {
    if (!videoRef.current) return;

    // Only load native tracks on mobile devices
    if (!isMobileDevice()) {
      return;
    }

    const video = videoRef.current;

    // Remove existing subtitle tracks
    const existingTracks = video.querySelectorAll('track[kind="subtitles"]');
    existingTracks.forEach((track) => track.remove());

    // Add new subtitle track if one is selected
    if (selectedSubtitle && selectedSubtitle.url) {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = selectedSubtitle.display || selectedSubtitle.language || 'Subtitles';
      track.srclang = selectedSubtitle.language || 'en';
      track.default = true;

      if (selectedSubtitle.url.includes('.srt') || selectedSubtitle.format === 'srt') {
        convertSRTToVTTBlob(selectedSubtitle.url)
          .then((vttBlob) => {
            if (vttBlob) {
              track.src = URL.createObjectURL(vttBlob);
              video.appendChild(track);

              track.addEventListener('load', () => {
                if (track.track) {
                  track.track.mode = subtitlesEnabled ? 'showing' : 'hidden';
                }
              });
            }
          })
          .catch((err) => {
            console.error('Failed to convert SRT to VTT:', err);
          });
      } else {
        track.src = selectedSubtitle.url;
        video.appendChild(track);

        // Enable the track
        track.addEventListener('load', () => {
          if (track.track) {
            track.track.mode = subtitlesEnabled ? 'showing' : 'hidden';
          }
        });
      }
    }

    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].kind === 'subtitles') {
        tracks[i].mode = subtitlesEnabled ? 'showing' : 'hidden';
      }
    }
  }, [selectedSubtitle, subtitlesEnabled]);

  // Helper function to convert SRT to VTT
  const convertSRTToVTTBlob = async (srtUrl) => {
    try {
      const response = await fetch(srtUrl, {
        mode: 'cors',
        headers: { Accept: 'text/plain, text/vtt, application/x-subrip' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch SRT: ${response.status}`);
      }

      const srtText = await response.text();
      const vttText = convertSRTToVTT(srtText);

      return new Blob([vttText], { type: 'text/vtt' });
    } catch (err) {
      console.error('Error converting SRT to VTT:', err);
      return null;
    }
  };

  // Helper function to convert SRT format to VTT format
  const convertSRTToVTT = (srtText) => {
    let vttText = 'WEBVTT\n\n';

    const blocks = srtText.trim().split(/\n\s*\n/);

    blocks.forEach((block) => {
      const lines = block.trim().split('\n');
      if (lines.length >= 3) {
        const timeString = lines[1];
        const text = lines.slice(2).join('\n');

        const vttTimeString = timeString.replace(/,/g, '.');

        vttText += `${vttTimeString}\n${text}\n\n`;
      }
    });

    return vttText;
  };

  // Handle progress bar dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => {
        if (isDragging) {
          handleSeek(e, videoRef, duration, progressBarRef);
        }
      };
      const handleGlobalMouseUp = () => setIsDragging(false);

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, duration]);

  // Handle volume slider dragging
  useEffect(() => {
    if (isVolumeDragging) {
      const handleGlobalMouseMove = (e) => {
        if (isVolumeDragging) {
          handleVolumeSliderSeek(e);
        }
      };
      const handleGlobalMouseUp = () => setIsVolumeDragging(false);

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isVolumeDragging]);

  // Volume slider timeout management
  const showVolumeSliderTemporarily = () => {
    setShowVolumeSlider(true);

    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }

    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 5000);
  };

  const handleVolumeMouseEnter = () => {
    showVolumeSliderTemporarily();
  };

  const handleVolumeMouseLeave = () => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }

    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 300);
  };

  const handleVolumeSliderMouseEnter = () => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    setShowVolumeSlider(true);
    setIsVolumeHovered(true);
  };

  const handleVolumeSliderMouseLeave = () => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }

    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 300);
    setIsVolumeHovered(false);
  };

  // Event handlers
  const handleMouseMove = () => {
    showControlsTemporarily(setShowControls, controlsTimeoutRef, isPlaying);
  };

  const handleTogglePlay = () => {
    togglePlay(isPlaying, videoRef);
  };

  const handleProgressMouseDown = (e) => {
    setIsDragging(true);
    handleSeek(e, videoRef, duration, progressBarRef);
    e.preventDefault();
  };

  const handleProgressMouseEnter = () => {
    setIsProgressHovered(true);
  };

  const handleProgressMouseLeave = () => {
    setIsProgressHovered(false);
  };

  const handleSkipTime = (seconds) => {
    skipTime(seconds, videoRef);
  };

  const handleToggleMute = () => {
    toggleMute(videoRef);
  };

  const handleVolumeChangeEvent = (e) => {
    handleVolumeChange(e, videoRef);
  };

  const handleVolumeSliderMouseDown = (e) => {
    setIsVolumeDragging(true);
    handleVolumeSliderSeek(e);
    e.preventDefault();
  };

  const handleVolumeSliderSeek = (e) => {
    if (volumeSliderRef.current && videoRef.current) {
      const rect = volumeSliderRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      videoRef.current.volume = pos;
      videoRef.current.muted = pos === 0;
    }
  };

  const handleToggleFullscreen = () => {
    toggleFullscreen(playerRef, setIsFullscreen);
  };

  const handleTogglePictureInPicture = () => {
    togglePictureInPicture(videoRef, isPictureInPicture);
  };

  const handleSelectSubtitle = (subtitle) => {
    onSelectSubtitle(subtitle, videoRef);
  };

  const handleSubtitleSettingsChange = (newSettings) => {
    setSubtitleSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleVideoError = (e) => {
    console.error('Video playback error:', e);
    onError('Video playback failed. Please try again.');
  };

  // Settings handlers
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    changePlaybackSpeed(speed, videoRef);
  };

  const handleQualityChange = async (quality) => {
    if (externalOnQualityChange) {
      externalOnQualityChange(quality);
    } else {
      setSelectedQuality(quality);
      await changeQuality(quality, hlsRef, videoRef, currentTime);
    }
  };

  const handleVolumeBoostChange = (boost) => {
    setVolumeBoost(boost);
    applyVolumeBoost(boost);
  };

  // Setup Web Audio API for volume boost
  const setupAudioContext = () => {
    if (!videoRef.current || audioContextRef.current) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(videoRef.current);
      const gainNode = audioContext.createGain();

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      gainNodeRef.current = gainNode;
      sourceNodeRef.current = source;

      // Apply current volume boost
      applyVolumeBoost(volumeBoost);
    } catch (error) {
      console.error('Failed to setup audio context for volume boost:', error);
    }
  };

  const applyVolumeBoost = (boost) => {
    if (gainNodeRef.current) {
      // Convert percentage to gain multiplier (0% = 1x, 100% = 2x, 300% = 4x)
      const gainValue = 1 + boost / 100;
      gainNodeRef.current.gain.setValueAtTime(gainValue, audioContextRef.current.currentTime);
    }
  };

  // Source management handlers
  const handleSourceChange = (source) => {
    if (setManualSourceOverride) {
      setManualSourceOverride(source);
    }
  };

  // Handle global keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      const handledKeys = [
        ' ',
        'Spacebar',
        'k',
        'K',
        'ArrowRight',
        'l',
        'L',
        'ArrowLeft',
        'j',
        'J',
        'ArrowUp',
        'ArrowDown',
        'm',
        'M',
        'f',
        'F',
      ];
      if (handledKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      switch (e.key) {
        // Play/pause: Spacebar or K
        case ' ':
        case 'Spacebar':
          if (document.activeElement.tagName !== 'BUTTON') {
            handleTogglePlay();
          }
          break;
        case 'k':
        case 'K':
          handleTogglePlay();
          break;

        // +10s: Right arrow or L
        case 'ArrowRight':
        case 'l':
        case 'L':
          handleSkipTime(10);
          break;

        // -10s: Left arrow or J
        case 'ArrowLeft':
        case 'j':
        case 'J':
          handleSkipTime(-10);
          break;

        // Volume controls
        case 'ArrowUp':
          if (videoRef.current) {
            const newVolume = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = newVolume;
            if (videoRef.current.muted && newVolume > 0) {
              videoRef.current.muted = false;
            }
          }
          break;

        case 'ArrowDown':
          if (videoRef.current) {
            const newVolume = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = newVolume;
            if (newVolume === 0) {
              videoRef.current.muted = true;
            }
          }
          break;

        // Mute: M
        case 'm':
        case 'M':
          handleToggleMute();
          break;

        // Fullscreen: F
        case 'f':
        case 'F':
          handleToggleFullscreen();
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying]);

  return (
    <PlayerTemplate
      // Video refs
      videoRef={videoRef}
      playerRef={playerRef}
      progressBarRef={progressBarRef}
      // NEW: progress persistence meta (used by PlayerTemplate -> attachProgressTracking)
      progressMeta={{
        id: mediaId ? Number(mediaId) : null,
        mediaType,
        season: Number(season) || 0,
        episode: Number(episode) || 0,
        sourceIndex: Number(sourceIndex) || 0,
      }}
      // Video state
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      volume={volume}
      isMuted={isMuted}
      bufferedAmount={bufferedAmount}
      isProgressHovered={isProgressHovered}
      isDragging={isDragging}
      showControls={showControls}
      isFullscreen={isFullscreen}
      isPictureInPicture={isPictureInPicture}
      isVideoLoading={isVideoLoading}
      // Volume slider state
      showVolumeSlider={showVolumeSlider}
      isVolumeDragging={isVolumeDragging}
      isVolumeHovered={isVolumeHovered}
      volumeSliderRef={volumeSliderRef}
      // Subtitle state
      showCaptionsPopup={showCaptionsPopup}
      setShowCaptionsPopup={setShowCaptionsPopup}
      subtitlesEnabled={subtitlesEnabled}
      subtitleError={subtitleError}
      subtitlesLoading={subtitlesLoading}
      availableSubtitles={availableSubtitles}
      selectedSubtitle={selectedSubtitle}
      currentSubtitleText={currentSubtitleText}
      subtitleSettings={subtitleSettings}
      onSubtitleSettingsChange={handleSubtitleSettingsChange}
      // Settings state
      showSettingsPopup={showSettingsPopup}
      setShowSettingsPopup={setShowSettingsPopup}
      playbackSpeed={playbackSpeed}
      availableQualities={finalAvailableQualities}
      selectedQuality={finalSelectedQuality}
      qualitiesLoading={qualitiesLoading}
      volumeBoost={volumeBoost}
      onVolumeBoostChange={handleVolumeBoostChange}
      // Source management state
      showSourcesPopup={showSourcesPopup}
      setShowSourcesPopup={setShowSourcesPopup}
      usedSource={usedSource}
      onSourceChange={handleSourceChange}
      // Event handlers
      onMouseMove={handleMouseMove}
      onTogglePlay={handleTogglePlay}
      onProgressMouseDown={handleProgressMouseDown}
      onProgressMouseEnter={handleProgressMouseEnter}
      onProgressMouseLeave={handleProgressMouseLeave}
      onSkipTime={handleSkipTime}
      onToggleMute={handleToggleMute}
      onVolumeChange={handleVolumeChangeEvent}
      onToggleFullscreen={handleToggleFullscreen}
      onTogglePictureInPicture={handleTogglePictureInPicture}
      onSelectSubtitle={handleSelectSubtitle}
      onVideoError={handleVideoError}
      onSpeedChange={handleSpeedChange}
      onQualityChange={handleQualityChange}
      // Volume slider handlers
      onVolumeMouseEnter={handleVolumeMouseEnter}
      onVolumeMouseLeave={handleVolumeMouseLeave}
      onVolumeSliderMouseEnter={handleVolumeSliderMouseEnter}
      onVolumeSliderMouseLeave={handleVolumeSliderMouseLeave}
      onVolumeSliderMouseDown={handleVolumeSliderMouseDown}
      onVolumeSliderHoverEnter={handleVolumeSliderMouseEnter}
      onVolumeSliderHoverLeave={handleVolumeSliderMouseLeave}
    />
  );
};

export default VideoPlayer;
