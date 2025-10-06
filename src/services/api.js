import { apiConfig } from '../config/api';

export const makeAPICall = async (endpoint, options = {}) => {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    console.error('TMDB API key missing in VITE_TMDB_API_KEY');
    throw new Error('Missing TMDB API key');
  }

  const queryParams = new URLSearchParams({
    ...options.params // Let backend handle api_key
  }).toString();

  const url = `${apiConfig.tmdbBaseUrl}${endpoint}${queryParams ? `?${queryParams}` : ''}`;
  console.log('Fetching TMDB:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      ...options,
      headers: {
        ...apiConfig.headers,
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type') || 'unknown';
    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMDB Error:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        response: errorText.slice(0, 200)
      });
      throw new Error(`TMDB fetch failed: ${response.status} ${response.statusText}`);
    }

    if (!contentType.includes('application/json')) {
      const errorText = await response.text();
      console.error('Non-JSON Response:', { contentType, response: errorText.slice(0, 200) });
      throw new Error('Expected JSON, received non-JSON response');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch Failed:', error, 'URL:', url);
    throw error;
  }
};
