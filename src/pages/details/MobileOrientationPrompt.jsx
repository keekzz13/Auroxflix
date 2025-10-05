import React from 'react';
import { RotateCcw } from 'lucide-react';

const MobileOrientationPrompt = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        <div className="mb-6">
          <RotateCcw className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-2xl font-bold mb-2">Rotate Your Device</h2>
          <p className="text-gray-300 mb-6">For the best phone viewing experience, please rotate your device to landscape mode.</p>
        </div>
        <button onClick={onContinue} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">Continue Anyway</button>
      </div>
    </div>
  );
};

export default MobileOrientationPrompt;
