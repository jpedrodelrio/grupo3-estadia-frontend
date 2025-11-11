/**
 * Tipos relacionados con tareas y gestión de equipos
 */

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

// Tipos auxiliares para Task
export type TaskType = 'social' | 'clinica' | 'administrativa' | 'coordinacion';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'critica';
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
