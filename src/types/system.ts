/**
 * Tipos relacionados con alertas, usuarios y otros elementos del sistema
 */

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

/**
 * Datos de entrada para predicción de sobre-estadía
 */
export interface PrediccionNuevoPacienteInput {
  rut: string;
  edad: number;
  sexo: string; // M/F, Hombre/Mujer, masculino/femenino
  servicio_clinico: string;
  prevision: string;
  fecha_estimada_de_alta: number | string; // días o fecha
  riesgo_social: number | string; // 0/1/2 o Bajo/Medio/Alto
  riesgo_clinico: number | string;
  riesgo_administrativo: number | string;
  codigo_grd: number;
}

/**
 * Respuesta de predicción de sobre-estadía
 */
export interface PrediccionNuevoPacienteResponse {
  rut: string;
  edad: number;
  sexo: string;
  servicio_clinico: string;
  prevision: string;
  fecha_estimada_de_alta: number | string;
  riesgo_social: number | string;
  riesgo_clinico: number | string;
  riesgo_administrativo: number | string;
  codigo_grd: number;
  probabilidad_sobre_estadia: number; // 0-1
  riesgo_categoria: 'Baja' | 'Media' | 'Alta';
  created_at: string;
}

/**
 * Respuesta del endpoint de predicción
 */
export interface PrediccionNuevosPacientesResponse {
  count: number;
  items: PrediccionNuevoPacienteResponse[];
}

// Tipos auxiliares
export type AlertType = 'estadia_prolongada' | 'riesgo_social' | 'riesgo_clinico' | 'riesgo_administrativo';
export type AlertLevel = 'amarillo' | 'rojo';
export type UserRole = 'gestor_estadia' | 'trabajador_social' | 'analista' | 'jefe_servicio' | 'admin';
export type ComplexityLevel = 'baja' | 'media' | 'alta';
export type RiskPredictionLevel = 'bajo' | 'medio' | 'alto' | 'critico';
export type RiesgoCategoria = 'Baja' | 'Media' | 'Alta';
