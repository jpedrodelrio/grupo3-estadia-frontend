/**
 * Tipos relacionados con pacientes hospitalizados
 */

export interface Patient {
  episodio: string;
  id: string;
  rut: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_de_nacimiento: string;
  edad: number;
  sexo: 'M' | 'F';
  convenio: string;
  nombre_de_la_aseguradora: string;
  ultima_cama: string | null;
  fecha_ingreso: string;
  fecha_estimada_alta: string;
  dias_hospitalizacion: number;
  valor_parcial_estadia: string;
  diagnostico_principal: string;
  tipo_cuenta_1: string | null;
  tipo_cuenta_2: string | null;
  tipo_cuenta_3: string | null;
  riesgo_social: 'bajo' | 'medio' | 'alto';
  riesgo_clinico: 'bajo' | 'medio' | 'alto';
  riesgo_administrativo: 'bajo' | 'medio' | 'alto';
  nivel_riesgo_global: 'verde' | 'amarillo' | 'rojo';
  estado: 'activo' | 'alta_pendiente' | 'dado_alta';
  prevision: string;
  created_at: string;
  updated_at: string;
}

export interface PatientNote {
  id: string;
  patient_id: string;
  user_name: string;
  user_role: string;
  tipo_gestion: 'social' | 'clinica' | 'administrativa' | 'general';
  nota: string;
  fecha_gestion: string;
  created_at: string;
}

// Tipos auxiliares para Patient
export type RiskLevel = 'bajo' | 'medio' | 'alto';
export type GlobalRisk = 'verde' | 'amarillo' | 'rojo';
export type PatientStatus = 'activo' | 'alta_pendiente' | 'dado_alta';
export type GestionType = 'social' | 'clinica' | 'administrativa' | 'general';
