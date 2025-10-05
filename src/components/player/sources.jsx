import React from 'react';
import { ServerSolid } from 'iconoir-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

const SourcesManager = ({
  showSourcesPopup,
  setShowSourcesPopup,
  currentSource,
  onSourceChange,
  container
}) => {
  const sources = ['Fox', 'PrimeNet'];

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleSourceSelect = (source) => {
    onSourceChange(source);
    setShowSourcesPopup(false);
  };

  const normalizedCurrentSource = currentSource?.toLowerCase() === 'fox' ? 'Fox' : currentSource?.toLowerCase() === 'primenet' ? 'PrimeNet' : currentSource;

  return (
    <div className="relative sources-popup-container">
      <DropdownMenu open={showSourcesPopup} onOpenChange={setShowSourcesPopup}>
        <DropdownMenuTrigger asChild>
          <button
            onKeyDown={handleKeyDown}
            className="border-none cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all duration-200 ease-in-out w-[46px] h-[46px] relative overflow-hidden focus:outline-none bg-transparent text-white hover:bg-white/10 hover:scale-110 active:bg-white/20 active:scale-95"
            title={`Current source: ${normalizedCurrentSource}`}
          >
            <ServerSolid width="23" height="23" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          side="top" 
          align="end" 
          className={`w-64 bg-black/95 backdrop-blur-md border-white/20 text-white shadow-2xl transition-all duration-300 ease-out origin-bottom-right ${
            showSourcesPopup 
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
            <div className="flex items-center justify-between px-2 pt-1.5">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-white">Sources</span>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {sources.map((source, index) => (
                <DropdownMenuItem
                  key={source}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSourceSelect(source);
                  }}
                  className={`mx-1 my-0.5 px-2 py-2 rounded-md cursor-pointer transition-all duration-200 hover:bg-white focus:bg-white animate-in fade-in-0 slide-in-from-left-1 ${
                    normalizedCurrentSource === source 
                      ? 'bg-zinc-600/30 text-white/80' 
                      : 'text-white/80'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-4 bg-gray-600 rounded-xs flex items-center justify-center">
                      <span className="text-[0.5rem] text-white/60">
                        {source === 'Fox' ? 'FOX' : 'PN'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{source}</div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SourcesManager;
