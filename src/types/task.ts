/**
 * Tipos relacionados con tareas y gestión de equipos
 * Estructura alineada con el API backend
 */

export interface Task {
  id: string;
  paciente_episodio: string;
  gestor: string;
  rol?: string;
  tipo: 'general' | 'social' | 'clinica' | 'administrativa' | 'coordinacion';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  titulo: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  status: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  created_at: string;
  updated_at: string;
}

// Tipos auxiliares para Task
export type TaskType = 'general' | 'social' | 'clinica' | 'administrativa' | 'coordinacion';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'critica';
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
