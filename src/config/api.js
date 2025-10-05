const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const apiConfig = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
};