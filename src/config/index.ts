// Configuración de la aplicación
export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
};

export default CONFIG;
