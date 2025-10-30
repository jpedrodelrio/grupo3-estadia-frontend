// src/config/apiClient.ts
import axios from 'axios';
import { getApiConfig } from './apiConfig';

const api = axios.create({
  baseURL: getApiConfig().baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Puedes agregar interceptores si lo deseas
// api.interceptors.response.use(...);

export default api;
