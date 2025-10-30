// src/config/env.ts
export const ENV = {
    isDev: import.meta.env.DEV,
    devApiBaseUrl: import.meta.env.VITE_DEV_API_BASE_URL || 'http://localhost:5173',
    prodApiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://3.135.182.158',
    devIngestEndpoint: import.meta.env.VITE_DEV_API_INGEST_ENDPOINT || '/api/gestion/ingest/csv',
    prodIngestEndpoint: import.meta.env.VITE_API_INGEST_ENDPOINT || '/gestion/ingest/csv',
    prodProcessXlsmEndpoint: import.meta.env.VITE_API_PROCESS_XLSM_ENDPOINT || '/process-xlsm',
    prodDownloadCsvEndpoint: import.meta.env.VITE_API_DOWNLOAD_CSV_ENDPOINT || '/api/download-csv',
  };
  