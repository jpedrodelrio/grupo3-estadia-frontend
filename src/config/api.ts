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
  gestionEstadiasEndpoint: string;
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
      gestionEstadiasEndpoint: '/api/gestion/estadias',
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
      gestionEstadiasEndpoint: '/gestion/estadias',
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
  personasResumen: (page: number = 1, limit: number = 20, search?: string) => {
    const baseUrl = buildApiUrl(getApiConfig().personasResumenEndpoint);
    let url = `${baseUrl}?page=${page}&limit=${limit}`;
    if (search && search.trim() !== '') {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return url;
  },
  gestionesEpisodios: (episodio: string) => {
    const baseUrl = buildApiUrl(getApiConfig().gestionesEpisodiosEndpoint);
    return `${baseUrl}?episodio=${episodio}`;
  },
  createGestion: () => buildApiUrl(getApiConfig().gestionEstadiasEndpoint),
  updateGestion: (episodio: string, registroId: string) => {
    const baseUrl = buildApiUrl(getApiConfig().gestionEstadiasEndpoint);
    return `${baseUrl}/${episodio}/${registroId}`;
  },
  deleteGestion: (episodio: string, registroId: string) => {
    const baseUrl = buildApiUrl(getApiConfig().gestionEstadiasEndpoint);
    return `${baseUrl}/${episodio}/${registroId}`;
  gestoras: () => {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      // En desarrollo, usar el proxy de Vite
      return '/api/tareas/gestoras';
    } else {
      // En producción, usar la URL completa
      const config = getApiConfig();
      return `${config.baseUrl}/tareas/gestoras`;
    }
  },
  tareas: (filters?: {
    status?: string;
    prioridad?: string;
    gestor?: string;
    tipo?: string;
    paciente_episodio?: string;
    limit?: number;
    skip?: number;
  }) => {
    const isDev = import.meta.env.DEV;
    let baseUrl: string;
    if (isDev) {
      // En desarrollo, usar el proxy de Vite
      baseUrl = '/api/tareas';
    } else {
      // En producción, usar la URL completa
      const config = getApiConfig();
      baseUrl = `${config.baseUrl}/tareas`;
    }
    
    // Agregar parámetros de filtro si existen
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.prioridad) params.append('prioridad', filters.prioridad);
      if (filters.gestor) params.append('gestor', filters.gestor);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.paciente_episodio) params.append('paciente_episodio', filters.paciente_episodio);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.skip) params.append('skip', filters.skip.toString());
      
      const queryString = params.toString();
      if (queryString) {
        return `${baseUrl}?${queryString}`;
      }
    }
    
    return baseUrl;
  },
  tareaById: (taskId: string) => {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      return `/api/tareas/${taskId}`;
    } else {
      const config = getApiConfig();
      return `${config.baseUrl}/tareas/${taskId}`;
    }
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
