/**
 * Configuración de la aplicación basada en variables de entorno
 */

interface ApiConfig {
  baseUrl: string;
  ingestEndpoint: string;
  camasIngestEndpoint: string;
  processXlsmEndpoint: string;
  downloadCsvEndpoint: string;
  personasResumenEndpoint: string;
  gestionesEpisodiosEndpoint: string;
}

export interface FileTypeConfig {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: string;
  color: string;
  acceptedFormats: string[];
  maxSize: string;
}

/**
 * Obtiene la configuración de la API basada en el entorno
 */
export const getApiConfig = (): ApiConfig => {
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    // Configuración para desarrollo
    return {
      baseUrl: import.meta.env.VITE_DEV_API_BASE_URL || 'http://localhost:5173',
      ingestEndpoint: import.meta.env.VITE_DEV_API_INGEST_ENDPOINT || '/api/gestion/ingest/csv',
      camasIngestEndpoint: '/api/camas/ingest/csv',
      processXlsmEndpoint: '/process-xlsm',
      downloadCsvEndpoint: '/api/download-csv',
      personasResumenEndpoint: '/api/gestion/personas/resumen',
      gestionesEpisodiosEndpoint: '/api/gestion/episodios/resumen',
    };
  } else {
    // Configuración para producción
    return {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://3.135.182.158',
      ingestEndpoint: import.meta.env.VITE_API_INGEST_ENDPOINT || '/gestion/ingest/csv',
      camasIngestEndpoint: '/camas/ingest/csv',
      processXlsmEndpoint: import.meta.env.VITE_API_PROCESS_XLSM_ENDPOINT || '/process-xlsm',
      downloadCsvEndpoint: import.meta.env.VITE_API_DOWNLOAD_CSV_ENDPOINT || '/api/download-csv',
      personasResumenEndpoint: '/gestion/personas/resumen',
      gestionesEpisodiosEndpoint: '/gestion/episodios/resumen',
    };
  }
};

/**
 * Construye la URL completa para un endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  const config = getApiConfig();
  return `${config.baseUrl}${endpoint}`;
};

/**
 * Configuración de tipos de archivo disponibles
 */
export const fileTypeConfigs: FileTypeConfig[] = [
  {
    id: 'gestion-estadias',
    name: 'Gestión de Estadías',
    description: 'Archivo Excel con respuestas de formularios (.xlsm, .xlsx, .xls, .csv)',
    endpoint: '/gestion/ingest/csv',
    icon: 'FileSpreadsheet',
    color: 'blue',
    acceptedFormats: ['.xlsm', '.xlsx', '.xls', '.csv'],
    maxSize: '50MB'
  },
  {
    id: 'camas-nwp',
    name: 'Camas NWP',
    description: 'Archivo Excel para gestión de camas NWP (.xlsx, .xls, .csv)',
    endpoint: '/camas/ingest/csv',
    icon: 'Bed',
    color: 'green',
    acceptedFormats: ['.xlsx', '.xls', '.csv'],
    maxSize: '50MB'
  }
];

/**
 * Obtiene la configuración de un tipo de archivo por ID
 */
export const getFileTypeConfig = (fileTypeId: string): FileTypeConfig | undefined => {
  return fileTypeConfigs.find(config => config.id === fileTypeId);
};

/**
 * URLs preconstruidas para uso común
 */
export const apiUrls = {
  ingest: () => buildApiUrl(getApiConfig().ingestEndpoint),
  camasIngest: () => buildApiUrl(getApiConfig().camasIngestEndpoint),
  processXlsm: () => buildApiUrl(getApiConfig().processXlsmEndpoint),
  downloadCsv: (filename: string) => buildApiUrl(`${getApiConfig().downloadCsvEndpoint}/${filename}`),
  personasResumen: (page: number = 1, limit: number = 20) => {
    const baseUrl = buildApiUrl(getApiConfig().personasResumenEndpoint);
    return `${baseUrl}?page=${page}&limit=${limit}`;
  },
  gestionesEpisodios: (episodio: string) => {
    const baseUrl = buildApiUrl(getApiConfig().gestionesEpisodiosEndpoint);
    return `${baseUrl}?episodio=${episodio}`;
  },
  // URL dinámica basada en tipo de archivo
  uploadByType: (fileTypeId: string) => {
    const config = getFileTypeConfig(fileTypeId);
    if (!config) return null;
    
    let url: string;
    
    // Para gestión de estadías, usar el endpoint configurado
    if (fileTypeId === 'gestion-estadias') {
      url = buildApiUrl(getApiConfig().ingestEndpoint);
    }
    // Para camas NWP, usar el endpoint específico
    else if (fileTypeId === 'camas-nwp') {
      url = buildApiUrl(getApiConfig().camasIngestEndpoint);
    }
    else {
      return null;
    }
    
    console.log('🔧 Debug - Construyendo URL:', {
      fileTypeId,
      config,
      url,
      isDev: import.meta.env.DEV
    });
    
    return url;
  },
};
