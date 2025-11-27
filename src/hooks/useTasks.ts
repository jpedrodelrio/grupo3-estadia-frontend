import { useState, useCallback } from 'react';
import { Task } from '../types';
import { apiUrls } from '../config/api';

/**
 * Mapea el status del frontend al formato que espera el backend
 * El backend podría esperar valores diferentes (ej: "completado" vs "completada", "en progreso" vs "en_progreso")
 */
const mapStatusToBackend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pendiente': 'pendiente',
    'en_progreso': 'en progreso', // El backend podría esperar "en progreso" (con espacio) en lugar de "en_progreso"
    'completada': 'completado', // El backend podría esperar "completado" (masculino)
    'cancelada': 'cancelada',
  };
  return statusMap[status] || status;
};

/**
 * Mapea el status del backend al formato del frontend
 */
const mapStatusFromBackend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pendiente': 'pendiente',
    'en_progreso': 'en_progreso',
    'en progreso': 'en_progreso', // Convertir "en progreso" del backend a "en_progreso" del frontend
    'en-progreso': 'en_progreso', // Convertir "en-progreso" del backend a "en_progreso" del frontend
    'completado': 'completada', // Convertir "completado" del backend a "completada" del frontend
    'completada': 'completada',
    'cancelada': 'cancelada',
  };
  return statusMap[status] || status;
};

export interface CreateTaskRequest {
  paciente_episodio: string;
  gestor: string;
  tipo: 'general' | 'social' | 'clinica' | 'administrativa' | 'coordinacion';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  titulo: string;
  status: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  rol?: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
}

export interface TaskFilters {
  status?: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  prioridad?: 'baja' | 'media' | 'alta' | 'critica';
  gestor?: string;
  tipo?: 'general' | 'social' | 'clinica' | 'administrativa' | 'coordinacion';
  paciente_episodio?: string;
  limit?: number;
  skip?: number;
}

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: (filters?: TaskFilters) => Promise<Task[]>;
  getTaskById: (taskId: string) => Promise<Task | null>;
  createTask: (task: CreateTaskRequest) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<CreateTaskRequest & { status: string }>) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  refreshTasks: (filters?: TaskFilters) => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<TaskFilters | undefined>(undefined);

  const createTask = useCallback(async (task: CreateTaskRequest): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const url = apiUrls.tareas();
      console.log('🔄 Creando tarea en:', url, task);
      
      // Preparar el body, solo incluyendo campos que tienen valor
      const body: Record<string, unknown> = {
        paciente_episodio: task.paciente_episodio,
        gestor: task.gestor,
        tipo: task.tipo,
        prioridad: task.prioridad,
        titulo: task.titulo,
        status: mapStatusToBackend(task.status), // Mapear status al formato del backend
      };

      // Agregar campos opcionales solo si tienen valor
      if (task.rol && task.rol.trim() !== '') {
        body.rol = task.rol;
      }
      if (task.descripcion && task.descripcion.trim() !== '') {
        body.descripcion = task.descripcion;
      }
      if (task.fecha_inicio && task.fecha_inicio.trim() !== '') {
        // Convertir datetime-local a ISO string
        const fechaInicio = new Date(task.fecha_inicio);
        body.fecha_inicio = fechaInicio.toISOString();
      }
      if (task.fecha_vencimiento && task.fecha_vencimiento.trim() !== '') {
        // Convertir datetime-local a ISO string
        const fechaVencimiento = new Date(task.fecha_vencimiento);
        body.fecha_vencimiento = fechaVencimiento.toISOString();
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();

      if (!response.ok) {
        // Si la respuesta es HTML, probablemente es un error 404 o del servidor
        if (text.trim().startsWith('<!')) {
          throw new Error(`Error del servidor: El endpoint no está disponible (${response.status})`);
        }
        let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
        }
        throw new Error(errorMessage);
      }

      // Intentar parsear como JSON
      let newTask: Task;
      try {
        newTask = JSON.parse(text);
      } catch {
        throw new Error('Error: El servidor devolvió una respuesta inválida');
      }

      console.log('✅ Tarea creada exitosamente:', newTask);
      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear tarea';
      setError(errorMessage);
      console.error('❌ Error al crear tarea:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<CreateTaskRequest & { status: string }>): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const url = `${apiUrls.tareas()}/${taskId}`;
      console.log('🔄 Actualizando tarea en:', url, updates);

      // Preparar el body con solo los campos que se están actualizando
      const body: Record<string, unknown> = {};

      // Campos requeridos/opcionales - solo incluir si tienen valor
      if (updates.paciente_episodio !== undefined && updates.paciente_episodio !== '') {
        body.paciente_episodio = updates.paciente_episodio;
      }
      if (updates.gestor !== undefined && updates.gestor !== '') {
        body.gestor = updates.gestor;
      }
      if (updates.tipo !== undefined) {
        body.tipo = updates.tipo;
      }
      if (updates.prioridad !== undefined) {
        body.prioridad = updates.prioridad;
      }
      if (updates.titulo !== undefined && updates.titulo !== '') {
        body.titulo = updates.titulo;
      }
      if (updates.status !== undefined) {
        // Mapear el status al formato que espera el backend
        const mappedStatus = mapStatusToBackend(updates.status);
        body.status = mappedStatus;
        console.log('🔄 Mapeo de status:', { original: updates.status, mapeado: mappedStatus });
      }
      if (updates.rol !== undefined && updates.rol !== '') {
        body.rol = updates.rol;
      }
      if (updates.descripcion !== undefined && updates.descripcion !== '') {
        body.descripcion = updates.descripcion;
      }
      
      // Manejar fechas: convertir a ISO o null si están vacías
      if (updates.fecha_inicio !== undefined) {
        if (updates.fecha_inicio && updates.fecha_inicio.trim() !== '') {
          try {
            const fechaInicio = new Date(updates.fecha_inicio);
            if (!isNaN(fechaInicio.getTime())) {
              body.fecha_inicio = fechaInicio.toISOString();
            }
          } catch (e) {
            console.warn('Error al convertir fecha_inicio:', e);
          }
        } else {
          // Si está vacío, enviar null para limpiar el campo
          body.fecha_inicio = null;
        }
      }
      
      if (updates.fecha_vencimiento !== undefined) {
        if (updates.fecha_vencimiento && updates.fecha_vencimiento.trim() !== '') {
          try {
            const fechaVencimiento = new Date(updates.fecha_vencimiento);
            if (!isNaN(fechaVencimiento.getTime())) {
              body.fecha_vencimiento = fechaVencimiento.toISOString();
            }
          } catch (e) {
            console.warn('Error al convertir fecha_vencimiento:', e);
          }
        } else {
          // Si está vacío, enviar null para limpiar el campo
          body.fecha_vencimiento = null;
        }
      }
      
      console.log('📤 Body de actualización:', JSON.stringify(body, null, 2));

      const response = await fetch(url, {
        method: 'PUT', // O PATCH, dependiendo de lo que use el backend
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();

      if (!response.ok) {
        if (text.trim().startsWith('<!')) {
          throw new Error(`Error del servidor: El endpoint no está disponible (${response.status})`);
        }
        let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
          // Log detallado del error para debugging
          if (response.status === 422) {
            console.error('❌ Detalles del error 422 al actualizar tarea:', {
              status: response.status,
              statusText: response.statusText,
              errorData,
              bodyEnviado: body,
            });
          }
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
          console.error('❌ Error - Respuesta no parseable:', text);
        }
        throw new Error(errorMessage);
      }

      let updatedTask: Task;
      try {
        updatedTask = JSON.parse(text);
        // Mapear el status del backend al formato del frontend
        if (updatedTask.status) {
          updatedTask.status = mapStatusFromBackend(updatedTask.status) as Task['status'];
        }
      } catch {
        throw new Error('Error: El servidor devolvió una respuesta inválida');
      }

      console.log('✅ Tarea actualizada exitosamente:', updatedTask);
      return updatedTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al actualizar tarea';
      setError(errorMessage);
      console.error('❌ Error al actualizar tarea:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async (filters?: TaskFilters): Promise<Task[]> => {
    setLoading(true);
    setError(null);

    try {
      const url = apiUrls.tareas(filters);
      console.log('🔄 Obteniendo tareas con filtros:', { filters, url });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();

      if (!response.ok) {
        if (text.trim().startsWith('<!')) {
          throw new Error(`Error del servidor: El endpoint no está disponible (${response.status})`);
        }
        let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
        }
        throw new Error(errorMessage);
      }

      let tasksData: Task[];
      try {
        // El endpoint puede devolver un array directamente o un objeto con results
        const parsed = JSON.parse(text);
        tasksData = Array.isArray(parsed) ? parsed : (parsed.results || parsed.tasks || []);
        // Mapear el status de cada tarea del backend al formato del frontend
        tasksData = tasksData.map(task => ({
          ...task,
          status: mapStatusFromBackend(task.status) as Task['status'],
        }));
      } catch {
        throw new Error('Error: El servidor devolvió una respuesta inválida');
      }

      console.log('✅ Tareas obtenidas:', tasksData.length);
      setTasks(tasksData);
      setCurrentFilters(filters); // Guardar los filtros actuales
      return tasksData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener tareas';
      setError(errorMessage);
      console.error('❌ Error al obtener tareas:', errorMessage);
      setTasks([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTaskById = useCallback(async (taskId: string): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const url = apiUrls.tareaById(taskId);
      console.log('🔄 Obteniendo tarea por ID:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();

      if (!response.ok) {
        if (text.trim().startsWith('<!')) {
          throw new Error(`Error del servidor: El endpoint no está disponible (${response.status})`);
        }
        let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
        }
        throw new Error(errorMessage);
      }

      let task: Task;
      try {
        task = JSON.parse(text);
      } catch {
        throw new Error('Error: El servidor devolvió una respuesta inválida');
      }

      console.log('✅ Tarea obtenida:', task);
      return task;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener tarea';
      setError(errorMessage);
      console.error('❌ Error al obtener tarea:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const url = apiUrls.tareaById(taskId);
      console.log('🔄 Eliminando tarea:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();

      if (!response.ok) {
        if (text.trim().startsWith('<!')) {
          throw new Error(`Error del servidor: El endpoint no está disponible (${response.status})`);
        }
        let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Tarea eliminada exitosamente');
      // Remover la tarea del estado local
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al eliminar tarea';
      setError(errorMessage);
      console.error('❌ Error al eliminar tarea:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTasks = useCallback(async (filters?: TaskFilters) => {
    // Si no se proporcionan filtros, usar los filtros actuales
    await fetchTasks(filters || currentFilters);
  }, [fetchTasks, currentFilters]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
  };
};

