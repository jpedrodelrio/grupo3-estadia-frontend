// src/config/apiConfig.ts
import { ENV } from './env';

export interface ApiConfig {
  baseUrl: string;
  ingestEndpoint: string;
  camasIngestEndpoint: string;
  processXlsmEndpoint: string;
  downloadCsvEndpoint: string;
  personasResumenEndpoint: string;
  gestionesEpisodiosEndpoint: string;
  gestionEstadiasEndpoint: string;
  gestorasEndpoint: string;
  tareasEndpoint: string;
  prediccionNuevosPacientesEndpoint: string;
}

export const getApiConfig = (): ApiConfig => {
  if (ENV.isDev) {
    return {
      baseUrl: ENV.devApiBaseUrl,
      ingestEndpoint: ENV.devIngestEndpoint,
      camasIngestEndpoint: '/api/camas/ingest/csv',
      processXlsmEndpoint: '/process-xlsm',
      downloadCsvEndpoint: '/api/download-csv',
      personasResumenEndpoint: '/api/gestion/personas/resumen',
      gestionesEpisodiosEndpoint: '/api/gestion/episodios/resumen',
      gestionEstadiasEndpoint: '/api/gestion/estadias',
      gestorasEndpoint: '/api/tareas/gestoras',
      tareasEndpoint: '/api/tareas',
      prediccionNuevosPacientesEndpoint: '/api/prediccion/nuevos-pacientes',
    };
  }

  return {
    baseUrl: ENV.prodApiBaseUrl,
    ingestEndpoint: ENV.prodIngestEndpoint,
    camasIngestEndpoint: '/camas/ingest/csv',
    processXlsmEndpoint: ENV.prodProcessXlsmEndpoint,
    downloadCsvEndpoint: ENV.prodDownloadCsvEndpoint,
    personasResumenEndpoint: '/gestion/personas/resumen',
    gestionesEpisodiosEndpoint: '/gestion/episodios/resumen',
    gestionEstadiasEndpoint: '/gestion/estadias',
    gestorasEndpoint: '/api/tareas/gestoras',
    tareasEndpoint: '/api/tareas',
    prediccionNuevosPacientesEndpoint: '/prediccion/nuevos-pacientes',
  };
};

export const buildApiUrl = (endpoint: string): string => {
  const config = getApiConfig();
  return `${config.baseUrl}${endpoint}`;
};
