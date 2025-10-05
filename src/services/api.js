import { apiConfig } from '../config/api';

export const makeAPICall = async (endpoint, options = {}) => {
  const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
    ...options,
    headers: {
      ...apiConfig.headers,
      ...options.headers,
    },
  });
  return response.json();
};