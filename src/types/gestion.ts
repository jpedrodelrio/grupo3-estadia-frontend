/**
 * Tipos relacionados con las gestiones de pacientes
 * Corresponde al endpoint /gestion/episodios/resumen
 */

/**
 * Registro individual de una gestión
 */
export interface RegistroGestion {
  marca_temporal: string;
  que_gestion_se_solicito: string;
  ultima_modificacion: string;
  fecha_inicio: string | null;
  hora_inicio: string | null;
  mes: string;
  ano: string;
  cama: string;
  texto_libre_diagnostico_admision: string;
  diagnostico_transfer: string | null;
  concretado: 'si' | 'SI' | 'no' | 'NO' | null;
  solicitud_de_traslado: string | null;
  status: string | null;
  causa_devolucion_rechazo: string | null;
  estado: string | null;
  motivo_de_cancelacion: string | null;
  motivo_de_rechazo: string | null;
  tipo_de_traslado: string | null;
  centro_de_destinatario: string | null;
  nivel_de_atencion: string | null;
  servicio_especialidad: string | null;
  fecha_de_finalizacion: string | null;
  hora_de_finalizacion: string | null;
  dias_solicitados_homecare: number | null;
  texto_libre_causa_rechazo: string | null;
}

/**
 * Estructura de respuesta del endpoint por episodio
 */
export interface GestionesEpisodio {
  episodio: string;
  registros: RegistroGestion[];
}

/**
 * Respuesta completa del endpoint
 */
export interface GestionesResumenResponse {
  count: number;
  results: GestionesEpisodio[];
}

/**
 * Estado del hook de gestiones
 */
export interface UseGestionesState {
  gestiones: RegistroGestion[];
  loading: boolean;
  error: string | null;
  episodio: string | null;
}

