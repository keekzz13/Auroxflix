// src/components/player/template.jsx

import React, { useEffect } from 'react';
import { PlaySolid, PauseSolid, SoundOffSolid, SoundLowSolid, SoundHighSolid, Expand, Collapse, ServerSolid } from 'iconoir-react';
import SubtitleManager from './subtitles';
import SettingsManager from './settings';
import SourcesManager from './sources';
import { formatTime } from './helpers';
import { isMobileDevice } from '../../utils';
import { attachProgressTracking } from './helpers'; // <-- ADDED

const ControlButton = ({ onClick, children, className = "", ...props }) => {
  const baseClasses = "border-none cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all duration-200 ease-in-out w-[46px] h-[46px] relative overflow-hidden focus:outline-none";
  const defaultClasses = "bg-transparent text-white hover:bg-white/10 hover:scale-110 active:bg-white/20 active:scale-95";
  
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`${baseClasses} ${className || defaultClasses}`}
      {...props}
    >
      {children}
    </button>
  );
};

const PlayerTemplate = ({
  // Video refs
  videoRef,
  playerRef,
  progressBarRef,
  
  // Video state
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  bufferedAmount,
  isProgressHovered,
  isDragging,
  showControls,
  isFullscreen,
  isPictureInPicture,
  isVideoLoading,
  
  // Volume slider state
  showVolumeSlider,
  isVolumeDragging,
  isVolumeHovered,
  volumeSliderRef,
  
  // Subtitle state
  showCaptionsPopup,
  setShowCaptionsPopup,
  subtitlesEnabled,
  subtitleError,
  subtitlesLoading,
  availableSubtitles,
  selectedSubtitle,
  currentSubtitleText,
  subtitleSettings,
  onSubtitleSettingsChange,
  
  // Settings state
  showSettingsPopup,
  setShowSettingsPopup,
  playbackSpeed,
  availableQualities,
  selectedQuality,
  qualitiesLoading,
  volumeBoost,
  onVolumeBoostChange,
  
  // Source management state
  showSourcesPopup,
  setShowSourcesPopup,
  usedSource,
  onSourceChange,
  
  // Event handlers
  onMouseMove,
  onTogglePlay,
  onProgressMouseDown,
  onProgressMouseEnter,
  onProgressMouseLeave,
  onSkipTime,
  onToggleMute,
  onVolumeChange,
  onToggleFullscreen,
  onTogglePictureInPicture,
  onSelectSubtitle,
  onVideoError,
  onSpeedChange,
  onQualityChange,
  
  // Volume slider handlers
  onVolumeMouseEnter,
  onVolumeMouseLeave,
  onVolumeSliderMouseEnter,
  onVolumeSliderMouseLeave,
  onVolumeSliderMouseDown,
  onVolumeSliderHoverEnter,
  onVolumeSliderHoverLeave,

  // NEW: progress persistence meta (optional)
  // { id, mediaType, season=0, episode=0, sourceIndex=0 }
  progressMeta
}) => {
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) { return <SoundOffSolid width="24" height="24" />; }
    else if (volume < 0.7) { return <SoundLowSolid width="24" height="24" />; }
    else { return <SoundHighSolid width="24" height="24" />; }
  };

  // Attach progress tracking (Supabase/localStorage) once refs/meta are ready
  useEffect(() => {
    if (!videoRef?.current || !progressMeta) return;
    const cleanup = attachProgressTracking(videoRef, progressMeta);
    return () => cleanup && cleanup();
  }, [
    videoRef,
    progressMeta?.id,
    progressMeta?.mediaType,
    progressMeta?.season,
    progressMeta?.episode,
    progressMeta?.sourceIndex
  ]);

  return (
    <div ref={playerRef} className={`fixed top-0 left-0 w-screen h-screen bg-black ${showControls ? 'cursor-default' : 'cursor-none'}`} onMouseMove={onMouseMove} onClick={onTogglePlay}>
      <video ref={videoRef} className="w-full h-full object-contain" onError={onVideoError}/>
      
      {isVideoLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"/>
        </div>
      )}
      
      {subtitlesEnabled && currentSubtitleText && !isMobileDevice() && (
        <div className={`absolute bottom-32 pointer-events-none ${
          subtitleSettings.position === 'left' ? 'left-8' : 
          subtitleSettings.position === 'right' ? 'right-8' : 
          'left-1/2 transform -translate-x-1/2'
        }`}>
          <span 
            className="inline-block px-4 py-2 bg-black/80 text-white font-medium rounded-md shadow-lg max-w-4xl leading-relaxed"
            style={{ 
              fontSize: `${subtitleSettings.fontSize}px`,
              textAlign: subtitleSettings.position === 'center' ? 'center' : subtitleSettings.position,
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)', 
              backdropFilter: 'blur(4px)', 
              border: '1px solid rgba(255,255,255,0.1)' 
            }}
            dangerouslySetInnerHTML={{ __html: currentSubtitleText.replace(/\n/g, '<br/>') }}
          />
        </div>
      )}
      
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-10 px-5 pb-2 transition-opacity duration-300 ease-in-out ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
        <div ref={progressBarRef} className="relative w-full py-3 cursor-pointer group" onMouseDown={onProgressMouseDown} onMouseEnter={onProgressMouseEnter} onMouseLeave={onProgressMouseLeave}>
          <div className="absolute inset-0 -my-2" />
          
          <div className="relative w-full h-1 bg-white/30 rounded-sm">
            <div className="absolute top-0 left-0 h-full bg-white/50 rounded-sm transition-all duration-200" style={{ width: `${bufferedAmount}%` }}/>
            <div className="absolute top-0 left-0 h-full bg-white rounded-sm" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}/>   
            <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${isProgressHovered || isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 8px)` }}/>
          </div>
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <ControlButton onClick={onTogglePlay}>
              {isPlaying ? (<PauseSolid width="28" height="28" />
              ) : (<PlaySolid width="28" height="28" />)}
            </ControlButton>

            <ControlButton onClick={() => onSkipTime(-10)}>
              <img src="/icons/back10.svg" alt="Back 10 seconds" className="w-6 h-6 select-none"/>
            </ControlButton>

            <ControlButton onClick={() => onSkipTime(10)}>
              <img src="/icons/forwards10.svg" alt="Forward 10 seconds" className="w-6 h-6 select-none"/>
            </ControlButton>

            <div className="flex items-center gap-2 relative">
              <ControlButton onClick={onToggleMute} onMouseEnter={onVolumeMouseEnter} onMouseLeave={onVolumeMouseLeave}>
                {getVolumeIcon()}
              </ControlButton>
              
              <div className={`volume-slider-transition ${showVolumeSlider ? 'volume-slider-visible' : 'volume-slider-hidden'}`} onMouseEnter={onVolumeSliderMouseEnter} onMouseLeave={onVolumeSliderMouseLeave}>
                <div ref={volumeSliderRef} className="relative w-full py-3 my-4 cursor-pointer group" onMouseDown={onVolumeSliderMouseDown} onMouseEnter={onVolumeSliderHoverEnter} onMouseLeave={onVolumeSliderHoverLeave}>
                  <div className="absolute inset-0 -my-2" />
                  
                  <div className="relative w-full h-1 bg-white/30 rounded-sm">
                    <div className="absolute top-0 left-0 h-full bg-white rounded-sm" style={{ width: `${isMuted ? 0 : volume * 100}%` }}/> 
                    <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg ${isVolumeHovered || isVolumeDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} style={{ left: `calc(${isMuted ? 0 : volume * 100}% - 6px)` }}/>
                  </div>
                </div>
              </div>
            </div>

            <span className="text-sm text-white min-w-[140px] select-none">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <ControlButton 
              onClick={onTogglePictureInPicture}
              className={isPictureInPicture 
                ? "bg-white text-black hover:bg-gray-200 hover:scale-110 active:bg-gray-300 active:scale-95" 
                : "bg-transparent text-white hover:bg-white/10 hover:scale-110 active:bg-white/20 active:scale-95"
              }
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/>
                <rect width="10" height="7" x="12" y="13" rx="2"/>
              </svg>
            </ControlButton>

            <SubtitleManager
              showCaptionsPopup={showCaptionsPopup}
              setShowCaptionsPopup={setShowCaptionsPopup}
              subtitlesEnabled={subtitlesEnabled}
              subtitleError={subtitleError}
              subtitlesLoading={subtitlesLoading}
              availableSubtitles={availableSubtitles}
              selectedSubtitle={selectedSubtitle}
              selectSubtitle={onSelectSubtitle}
              subtitleSettings={subtitleSettings}
              onSubtitleSettingsChange={onSubtitleSettingsChange}
              container={isFullscreen ? playerRef.current : undefined}
            />

            {usedSource && (
              <>
                <SourcesManager
                  showSourcesPopup={showSourcesPopup}
                  setShowSourcesPopup={setShowSourcesPopup}
                  currentSource={usedSource}
                  onSourceChange={onSourceChange}
                  container={isFullscreen ? playerRef.current : undefined}
                />
              </>
            )}

            <SettingsManager
              showSettingsPopup={showSettingsPopup}
              setShowSettingsPopup={setShowSettingsPopup}
              availableQualities={availableQualities}
              selectedQuality={selectedQuality}
              onSelectQuality={onQualityChange}
              playbackSpeed={playbackSpeed}
              onSpeedChange={onSpeedChange}
              qualitiesLoading={qualitiesLoading}
              volumeBoost={volumeBoost}
              onVolumeBoostChange={onVolumeBoostChange}
              container={isFullscreen ? playerRef.current : undefined}
            />

            <ControlButton onClick={onToggleFullscreen}>
              {isFullscreen ? (
                <Collapse width="24" height="24" />
              ) : (
                <Expand width="24" height="24" />
              )}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerTemplate;
