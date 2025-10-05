import React, { useState } from 'react';
import { ClosedCaptionsTagSolid, Settings } from 'iconoir-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

const transformFlagUrl = (flagUrl) => {
  if (!flagUrl) return null;
  
  const flagsApiMatch = flagUrl.match(/flagsapi\.com\/([A-Z]{2})\//);
  if (flagsApiMatch) {
    const countryCode = flagsApiMatch[1].toLowerCase();
    return `https://countryflagsapi.netlify.app/flag/${countryCode}.svg`;
  }
  
  return flagUrl;
};

const SubtitleManager = ({ 
  showCaptionsPopup, 
  setShowCaptionsPopup, 
  subtitlesEnabled, 
  subtitleError, 
  subtitlesLoading, 
  availableSubtitles, 
  selectedSubtitle, 
  selectSubtitle,
  subtitleSettings,
  onSubtitleSettingsChange,
  container 
}) => {
  const [activeTab, setActiveTab] = useState('subtitles'); // 'subtitles' or 'settings'

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleSettingsChange = (key, value) => {
    onSubtitleSettingsChange({ [key]: value });
  };

  return (
    <div className="relative captions-popup-container">
      <DropdownMenu open={showCaptionsPopup} onOpenChange={setShowCaptionsPopup}>
        <DropdownMenuTrigger asChild>
          <button
            onKeyDown={handleKeyDown}
            className={`border-none cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all duration-200 ease-in-out w-[46px] h-[46px] relative overflow-hidden focus:outline-none ${
              subtitlesEnabled 
                ? "bg-white text-black hover:bg-gray-200 hover:scale-110 active:bg-gray-300 active:scale-95" 
                : "bg-transparent text-white hover:bg-white/10 hover:scale-110 active:bg-white/20 active:scale-95"
            }`}
          >
            <ClosedCaptionsTagSolid width="24" height="24" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          side="top" 
          align="end" 
          className={`w-80 bg-black/95 backdrop-blur-md border-white/20 text-white shadow-2xl transition-all duration-300 ease-out origin-bottom-right ${
            showCaptionsPopup 
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
          <div className="p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-2 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('subtitles')}
                  className={`text-lg font-semibold transition-colors ${
                    activeTab === 'subtitles' ? 'text-white' : 'text-white/50 hover:text-white/80 cursor-pointer'
                  }`}
                >
                  Subtitles
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`p-1 rounded transition-all ${
                    activeTab === 'settings' 
                      ? 'text-white' 
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer'
                  }`}
                >
                  <Settings width="20" height="20" />
                </button>
              </div>
            </div>

            {activeTab === 'subtitles' ? (
              <div className="mt-2">
                {subtitleError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded px-3 py-2 text-sm text-red-200 mb-3 mx-2 animate-in fade-in-0 slide-in-from-top-1 duration-300">{subtitleError}</div>
                )}

                {subtitlesLoading ? (
                  <div className="px-2 py-3">
                    <div className="flex items-center space-x-2 text-sm text-white/60">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white/60"></div>
                      <span>Loading subtitles...</span>
                    </div>
                  </div>
                ) : availableSubtitles.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selectSubtitle(null);
                      }}
                      className={`mx-1 my-0.5 px-2 py-2 rounded-md cursor-pointer transition-all duration-200 hover:bg-white focus:bg-white ${!selectedSubtitle ? 'bg-zinc-600/30 text-zinc-300' : 'text-white/80'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-4 bg-gray-600 rounded-xs flex items-center justify-center">
                          <span className="text-[0.5rem] text-white/60">OFF</span>
                        </div>
                        <span className="text-sm">No subtitles</span>
                      </div>
                    </DropdownMenuItem>

                    {availableSubtitles.map((subtitle, index) => (
                      <DropdownMenuItem
                        key={subtitle.id}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); selectSubtitle(subtitle); }}
                        className={`mx-1 my-0.5 px-2 py-2 rounded-md cursor-pointer transition-all duration-200 hover:bg-white focus:bg-white animate-in fade-in-0 slide-in-from-left-1 ${selectedSubtitle?.id === subtitle.id ? 'bg-zinc-600/30 text-zinc-300' : 'text-white/80'}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-4 rounded-xs overflow-hidden flex-shrink-0 bg-gray-700">
                            {subtitle.flagUrl ? (
                              <img 
                                src={transformFlagUrl(subtitle.flagUrl)} 
                                alt={subtitle.language}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div 
                              className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white/60"
                              style={{ display: subtitle.flagUrl ? 'none' : 'flex' }}
                            >
                              {subtitle.language?.toUpperCase().slice(0, 2) || '??'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{subtitle.display || subtitle.language || 'Unknown'} {subtitle.isHearingImpaired && ('(CC)')}</div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ) : (
                  <div className="px-2 py-3 text-sm text-white/60">No subtitles available</div>
                )}
              </div>
            ) : (
              <div className="mt-2 space-y-4">
                <div className="px-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Text Size: {subtitleSettings.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="32"
                    value={subtitleSettings.fontSize}
                    onChange={(e) => handleSettingsChange('fontSize', parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, white 0%, white ${((subtitleSettings.fontSize - 12) / (32 - 12)) * 100}%, rgba(255,255,255,0.2) ${((subtitleSettings.fontSize - 12) / (32 - 12)) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>12px</span>
                    <span>32px</span>
                  </div>
                </div>

                <div className="px-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Delay: {subtitleSettings.delay > 0 ? '+' : ''}{subtitleSettings.delay}s
                  </label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="0.5"
                    value={subtitleSettings.delay}
                    onChange={(e) => handleSettingsChange('delay', parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.2) 50%, white 50%, white 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>-20s</span>
                    <span>0s</span>
                    <span>+20s</span>
                  </div>
                </div>

                <div className="px-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">Position</label>
                  <div className="flex gap-2">
                    {['left', 'center', 'right'].map((position) => (
                      <button
                        key={position}
                        onClick={() => handleSettingsChange('position', position)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
                          subtitleSettings.position === position
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {position.charAt(0).toUpperCase() + position.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SubtitleManager;
