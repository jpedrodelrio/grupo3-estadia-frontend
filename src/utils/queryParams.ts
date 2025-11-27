/**
 * Utilidades para construir query parameters de URLs
 */

/**
 * Construye una cadena de query parameters a partir de un objeto de filtros
 * Solo incluye los parámetros que tienen valores definidos
 */
export const buildQueryString = (params: Record<string, string | number | undefined | null>): string => {
  const urlParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlParams.append(key, String(value));
    }
  });
  
  const queryString = urlParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Construye una URL completa con query parameters
 */
export const buildUrlWithParams = (baseUrl: string, params: Record<string, string | number | undefined | null>): string => {
  const queryString = buildQueryString(params);
  return `${baseUrl}${queryString}`;
};

