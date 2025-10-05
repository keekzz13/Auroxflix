import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';

const SettingsManager = ({ 
  showSettingsPopup, 
  setShowSettingsPopup, 
  availableQualities, 
  selectedQuality, 
  onSelectQuality, 
  playbackSpeed, 
  onSpeedChange, 
  qualitiesLoading,
  container,
  volumeBoost = 0,
  onVolumeBoostChange
}) => {
  const speedOptions = [0.25, 0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2];
  const currentSpeedIndex = speedOptions.indexOf(playbackSpeed);
  
  const maxVolumeBoost = 300;

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleSpeedChange = (e) => {
    const newIndex = parseInt(e.target.value);
    if (newIndex < speedOptions.length) {
      onSpeedChange(speedOptions[newIndex]);
    }
  };

  const handleVolumeBoostChange = (e) => {
    const newBoost = parseInt(e.target.value);
    if (onVolumeBoostChange) {
      onVolumeBoostChange(newBoost);
    }
  };

  const getSpeedLabel = (speed) => {
    return speed === 1 ? '1x' : `${speed}x`;
  };

  const getVolumeBoostLabel = (boost) => {
    if (boost === 0) return 'Off';
    return `+${boost}%`;
  };

  return (
    <div className="relative settings-popup-container">
      <DropdownMenu open={showSettingsPopup} onOpenChange={setShowSettingsPopup}>
        <DropdownMenuTrigger asChild>
          <button
            onKeyDown={handleKeyDown}
            className="border-none cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all duration-200 ease-in-out w-[46px] h-[46px] relative overflow-hidden bg-transparent text-white hover:bg-white/10 hover:scale-110 active:bg-white/20 active:scale-95 focus:outline-none"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
            </svg>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          side="top" 
          align="end" 
          className={`w-80 bg-black/95 backdrop-blur-md border-white/20 text-white shadow-2xl transition-all duration-300 ease-out origin-bottom-right ${
            showSettingsPopup 
              ? 'animate-modal-scale-in opacity-100 scale-100' 
              : 'animate-modal-scale-out opacity-0 scale-85'
          }`}
          sideOffset={8}
          container={container}
          style={{
            transformOrigin: 'bottom right',
            willChange: 'transform, opacity'
          }}
        >
          <div className="p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Playback Speed: {getSpeedLabel(playbackSpeed)}
              </label>
              <input
                type="range"
                min="0"
                max={speedOptions.length - 1}
                value={currentSpeedIndex}
                onChange={handleSpeedChange}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, white 0%, white ${(currentSpeedIndex / (speedOptions.length - 1)) * 100}%, rgba(255,255,255,0.2) ${(currentSpeedIndex / (speedOptions.length - 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>¼x</span>
                <span>1x</span>
                <span>2x</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Boost Volume: {getVolumeBoostLabel(volumeBoost)}
              </label>
              <input
                type="range"
                min="0"
                max={maxVolumeBoost}
                step="25"
                value={volumeBoost}
                onChange={handleVolumeBoostChange}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, white 0%, white ${(volumeBoost / maxVolumeBoost) * 100}%, rgba(255,255,255,0.2) ${(volumeBoost / maxVolumeBoost) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>Off</span>
                <span>+150%</span>
                <span>+300%</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-white/80 mb-3">Quality</h4>
              
              {qualitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 text-sm text-white/60">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white/60"></div>
                    <span>Loading qualities...</span>
                  </div>
                </div>
              ) : availableQualities.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableQualities.map((quality, index) => (
                    <button
                      key={quality.url || index}
                      onClick={() => onSelectQuality(quality)}
                      onKeyDown={handleKeyDown}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
                        selectedQuality?.url === quality.url
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {quality.quality || `${quality.height}p` || 'Unknown'}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-white/60">
                  No quality options available
                </div>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SettingsManager;
