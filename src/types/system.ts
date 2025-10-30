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

// Tipos auxiliares
export type AlertType = 'estadia_prolongada' | 'riesgo_social' | 'riesgo_clinico' | 'riesgo_administrativo';
export type AlertLevel = 'amarillo' | 'rojo';
export type UserRole = 'gestor_estadia' | 'trabajador_social' | 'analista' | 'jefe_servicio' | 'admin';
export type ComplexityLevel = 'baja' | 'media' | 'alta';
export type RiskPredictionLevel = 'bajo' | 'medio' | 'alto' | 'critico';
