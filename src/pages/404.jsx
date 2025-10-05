import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  const goHome = () => { navigate('/'); };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <button className="px-6 py-3 bg-white text-black rounded-md hover:bg-gray-200 transition cursor-pointer" onClick={goHome}>
        Back to Home
      </button>
    </div>
  );
}
