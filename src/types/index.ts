export interface Patient {
  id: string;
  rut: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  edad: number;
  sexo: 'M' | 'F';
  servicio_clinico: string;
  fecha_ingreso: string;
  fecha_estimada_alta: string;
  dias_hospitalizacion: number;
  diagnostico_principal: string;
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

export interface Alert {
  id: string;
  patient_id: string;
  tipo_alerta: 'estadia_prolongada' | 'riesgo_social' | 'riesgo_clinico' | 'riesgo_administrativo';
  nivel: 'amarillo' | 'rojo';
  mensaje: string;
  activa: boolean;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'gestor_estadia' | 'trabajador_social' | 'analista' | 'jefe_servicio' | 'admin';
}

export interface Task {
  id: string;
  patient_id: string;
  assigned_to: string;
  assigned_role: string;
  tipo_tarea: 'social' | 'clinica' | 'administrativa' | 'coordinacion';
  titulo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  fecha_vencimiento: string;
  created_at: string;
  updated_at: string;
}

export interface GRDReference {
  codigo: string;
  descripcion: string;
  estancia_promedio: number;
  estancia_maxima: number;
  complejidad: 'baja' | 'media' | 'alta';
}

export interface SocialRiskPrediction {
  patient_id: string;
  score: number;
  nivel_riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
  factores_riesgo: string[];
  recomendaciones: string[];
  fecha_evaluacion: string;
}

export type RiskLevel = 'bajo' | 'medio' | 'alto';
export type GlobalRisk = 'verde' | 'amarillo' | 'rojo';
export type PatientStatus = 'activo' | 'alta_pendiente' | 'dado_alta';
export type AlertType = 'estadia_prolongada' | 'riesgo_social' | 'riesgo_clinico' | 'riesgo_administrativo';
export type GestionType = 'social' | 'clinica' | 'administrativa' | 'general';