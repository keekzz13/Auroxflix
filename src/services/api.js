import { apiConfig } from '../config/api'; // Maps to config.json

export const makeAPICall = async (endpoint, options = {}) => {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    console.error('TMDB API key missing in VITE_TMDB_API_KEY');
    throw new Error('Missing TMDB API key');
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    ...options.params,
  }).toString();

  const url = `${apiConfig.tmdbBaseUrl}${endpoint}${queryParams ? `?${queryParams}` : ''}`;
  console.log('Fetching TMDB:', url); // Debug

  try {
    const response = await fetch(url, {
      method: 'GET',
      ...options,
      headers: {
        ...apiConfig.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMDB Error:', response.status, response.statusText, errorText);
      throw new Error(`TMDB fetch failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch Failed:', error, 'URL:', url);
    throw error;
  }
};
