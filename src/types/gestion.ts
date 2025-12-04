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

/**
 * Datos para crear una nueva gestión
 * Campos opcionales excepto los mínimos requeridos: episodio, marca_temporal, nombre, tipo_cuenta_1
 */
export interface CreateGestionData {
  episodio: string;
  marca_temporal?: string; // Opcional en algunos casos
  nombre: string;
  tipo_cuenta_1: string;
  status?: string | null;
  causa_devolucion_rechazo?: string | null;
  ultima_modificacion?: string | null;
  que_gestion_se_solicito?: string | null;
  fecha_inicio?: string | null;
  hora_inicio?: string | null;
  informe?: string | null;
  tipo_cuenta_2?: string | null;
  tipo_cuenta_3?: string | null;
  fecha_admision?: string | null;
  mes?: string | null;
  ano?: string | null;
  fecha_alta?: string | null;
  cama?: string | null;
  texto_libre_diagnostico_admision?: string | null;
  diagnostico_transfer?: string | null;
  convenio?: string | null;
  nombre_de_la_aseguradora?: string | null;
  valor_parcial?: string | null;
  solicitud_de_traslado?: string | null;
  concretado?: string | null;
  dias_hospitalizacion?: number | null;
  dias_reales?: number | null;
  mes2?: string | null;
  ano2?: string | null;
  fecha_de_nacimiento?: string | null;
  sexo?: string | null;
  estado?: string | null;
  motivo_de_cancelacion?: string | null;
  motivo_de_rechazo?: string | null;
  tipo_de_solicitud?: string | null;
  tipo_de_traslado?: string | null;
  motivo_de_traslado?: string | null;
  centro_de_destinatario?: string | null;
  nivel_de_atencion?: string | null;
  servicio_especialidad?: string | null;
  fecha_de_finalizacion?: string | null;
  hora_de_finalizacion?: string | null;
  dias_solicitados_homecare?: number | null;
  texto_libre_causa_rechazo?: string | null;
  run?: string | null;
  rut?: string | null;
  // Nuevos campos del endpoint
  riesgo_social?: string | null;
  riesgo_clinico?: string | null;
  riesgo_administrativo?: string | null;
  ultima_cama?: string | null;
  prob_sobre_estadia?: number | null;
  grd_code?: string | null;
}

