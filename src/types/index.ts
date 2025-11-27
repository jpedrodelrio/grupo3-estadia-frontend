/**
 * Archivo principal de exportación de tipos
 * Centraliza todas las interfaces y tipos del sistema
 */

// Tipos de pacientes
export type {
  Patient,
  PatientNote,
  RiskLevel,
  GlobalRisk,
  PatientStatus,
  GestionType,
} from './patient';

// Tipos de personas resumen (endpoint)
export type {
  PersonaResumen,
  PersonasResumenResponse,
} from './persona';

// Tipos de tareas
export type {
  Task,
  TaskType,
  TaskPriority,
  TaskStatus,
} from './task';

// Tipos de gestoras
export type {
  Gestora,
  CreateGestoraRequest,
} from './gestora';

// Tipos del sistema (alertas, usuarios, etc.)
export type {
  Alert,
  User,
  GRDReference,
  SocialRiskPrediction,
  AlertType,
  AlertLevel,
  UserRole,
  ComplexityLevel,
  RiskPredictionLevel,
} from './system';

// Tipos de gestiones (endpoint)
export type {
  RegistroGestion,
  GestionesEpisodio,
  GestionesResumenResponse,
  UseGestionesState,
  CreateGestionData,
} from './gestion';