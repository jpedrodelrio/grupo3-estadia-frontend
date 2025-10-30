// src/config/fileTypes.ts
import { buildApiUrl, getApiConfig } from './apiConfig';
import { ENV } from './env';

export enum FileTypeId {
  GestionEstadias = 'gestion-estadias',
  CamasNwp = 'camas-nwp',
}

export interface FileTypeConfig {
  id: FileTypeId;
  name: string;
  description: string;
  endpoint: string;
  icon: string;
  color: string;
  acceptedFormats: string[];
  maxSize: string;
}

export const fileTypeConfigs: FileTypeConfig[] = [
  {
    id: FileTypeId.GestionEstadias,
    name: 'Gestión de Estadías',
    description: 'Archivo Excel con respuestas de formularios (.xlsm, .xlsx, .xls, .csv)',
    endpoint: '/gestion/ingest/csv',
    icon: 'FileSpreadsheet',
    color: 'blue',
    acceptedFormats: ['.xlsm', '.xlsx', '.xls', '.csv'],
    maxSize: '50MB',
  },
  {
    id: FileTypeId.CamasNwp,
    name: 'Camas NWP',
    description: 'Archivo Excel para gestión de camas NWP (.xlsx, .xls, .csv)',
    endpoint: '/camas/ingest/csv',
    icon: 'Bed',
    color: 'green',
    acceptedFormats: ['.xlsx', '.xls', '.csv'],
    maxSize: '50MB',
  },
] as const;

export const getFileTypeConfig = (fileTypeId: FileTypeId): FileTypeConfig | undefined =>
  fileTypeConfigs.find((config) => config.id === fileTypeId);

export const uploadByType = (fileTypeId: FileTypeId): string | null => {
  const config = getFileTypeConfig(fileTypeId);
  if (!config) return null;

  let url: string;

  switch (fileTypeId) {
    case FileTypeId.GestionEstadias:
      url = buildApiUrl(getApiConfig().ingestEndpoint);
      break;
    case FileTypeId.CamasNwp:
      url = buildApiUrl(getApiConfig().camasIngestEndpoint);
      break;
    default:
      return null;
  }

  if (ENV.isDev) {
    console.log('🔧 Debug - Construyendo URL:', { fileTypeId, config, url });
  }

  return url;
};
