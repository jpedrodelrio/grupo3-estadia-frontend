// src/config/endpoints.ts
import { getApiConfig, buildApiUrl } from './apiConfig';

export const apiUrls = {
  ingest: () => buildApiUrl(getApiConfig().ingestEndpoint),
  camasIngest: () => buildApiUrl(getApiConfig().camasIngestEndpoint),
  processXlsm: () => buildApiUrl(getApiConfig().processXlsmEndpoint),
  downloadCsv: (filename: string) =>
    buildApiUrl(`${getApiConfig().downloadCsvEndpoint}/${filename}`),
  personasResumen: (page = 1, limit = 20) => {
    const baseUrl = buildApiUrl(getApiConfig().personasResumenEndpoint);
    return `${baseUrl}?page=${page}&limit=${limit}`;
  },
  gestionesEpisodios: (episodio: string) => {
    const baseUrl = buildApiUrl(getApiConfig().gestionesEpisodiosEndpoint);
    return `${baseUrl}?episodio=${episodio}`;
  },
  prediccionNuevosPacientes: (persist: boolean = true) => {
    const baseUrl = buildApiUrl(getApiConfig().prediccionNuevosPacientesEndpoint);
    return `${baseUrl}?persist=${persist}`;
  },
};
