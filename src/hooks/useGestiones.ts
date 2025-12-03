/**
 * Hook personalizado para manejo de gestiones de pacientes
 * Encapsula la lógica de carga de gestiones desde el endpoint
 */

import { useState, useCallback, useRef } from 'react';
import { RegistroGestion, GestionesResumenResponse, UseGestionesState, CreateGestionData } from '../types';
import { apiUrls } from '../config/api';

export interface UseGestionesReturn extends UseGestionesState {
  fetchGestiones: (episodio: string) => Promise<void>;
  createGestion: (data: CreateGestionData) => Promise<void>;
  updateGestion: (episodio: string, registroId: string, data: Partial<CreateGestionData>) => Promise<void>;
  deleteGestion: (episodio: string, registroId: string) => Promise<void>;
  clearError: () => void;
  getGestionesByTipo: (tipo: string) => RegistroGestion[];
  refreshGestiones: () => Promise<void>;
}

export const useGestiones = (): UseGestionesReturn => {
  const [gestiones, setGestiones] = useState<RegistroGestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [episodio, setEpisodio] = useState<string | null>(null);
  const currentEpisodioRef = useRef<string | null>(null);

  /**
   * Carga las gestiones de un episodio específico
   */
  const fetchGestiones = useCallback(async (episodioParam: string) => {
    // Evitar cargas repetidas para el mismo episodio
    if (currentEpisodioRef.current === episodioParam && gestiones.length > 0) {
      console.log('⚠️ Gestiones ya cargadas para este episodio, omitiendo...');
      return;
    }

    setLoading(true);
    setError(null);
    currentEpisodioRef.current = episodioParam;

    try {
      const url = apiUrls.gestionesEpisodios(episodioParam);
      console.log(`🔄 Cargando gestiones para episodio: ${episodioParam}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const data: GestionesResumenResponse = await response.json();
      
      // Buscar el episodio específico en los resultados
      const episodioData = data.results.find(result => result.episodio === episodioParam);
      
      if (episodioData && episodioData.registros.length > 0) {
        setGestiones(episodioData.registros);
        setEpisodio(episodioParam);
        
        console.log(`✅ Gestiones cargadas: ${episodioData.registros.length} registros para episodio ${episodioParam}`);
      } else {
        setGestiones([]);
        console.log(`⚠️ No se encontraron gestiones para el episodio ${episodioParam}`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar gestiones';
      setError(errorMessage);
      console.error('❌ Error al cargar gestiones:', errorMessage);
      setGestiones([]);
    } finally {
      setLoading(false);
    }
  }, [gestiones.length]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Obtiene gestiones filtradas por tipo
   */
  const getGestionesByTipo = useCallback((tipo: string): RegistroGestion[] => {
    return gestiones.filter(g => g.que_gestion_se_solicito === tipo);
  }, [gestiones]);

  /**
   * Recarga las gestiones del episodio actual
   */
  const refreshGestiones = useCallback(async () => {
    if (episodio) {
      currentEpisodioRef.current = null; // Reset para forzar recarga
      await fetchGestiones(episodio);
    }
  }, [episodio, fetchGestiones]);

  /**
   * Crea una nueva gestión asociada a un episodio
   */
  const createGestion = useCallback(async (data: CreateGestionData) => {
    setLoading(true);
    setError(null);

    try {
      const url = apiUrls.createGestion();
      console.log('🔄 Creando nueva gestión para episodio:', data.episodio);
      console.log('📤 Datos enviados al servidor (POST /gestion/estadias):', JSON.stringify(data, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('❌ Error del servidor al crear gestión:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Error del servidor: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Gestión creada exitosamente');
      console.log('📥 Respuesta del servidor (POST /gestion/estadias):', JSON.stringify(result, null, 2));
      
      // Recargar gestiones del episodio después de crear
      if (data.episodio) {
        currentEpisodioRef.current = null; // Reset para forzar recarga
        await fetchGestiones(data.episodio);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear gestión';
      setError(errorMessage);
      console.error('❌ Error al crear gestión:', errorMessage);
      throw err; // Re-lanzar para que el componente pueda manejar el error
    } finally {
      setLoading(false);
    }
  }, [fetchGestiones]);

  /**
   * Actualiza una gestión existente
   * @param episodio - Episodio del paciente
   * @param registroId - marca_temporal de la gestión a actualizar
   * @param data - Datos actualizados de la gestión
   */
  const updateGestion = useCallback(async (episodio: string, registroId: string, data: Partial<CreateGestionData>) => {
    setLoading(true);
    setError(null);

    try {
      const url = apiUrls.updateGestion(episodio, registroId);
      console.log('🔄 Actualizando gestión:', { episodio, registroId });
      console.log('📤 Datos enviados al servidor (PUT /gestion/estadias/{episodio}/{registroId}):', JSON.stringify(data, null, 2));
      console.log('🔗 URL completa:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('❌ Error del servidor al actualizar gestión:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          episodio,
          registroId
        });
        throw new Error(`Error del servidor: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Gestión actualizada exitosamente');
      console.log('📥 Respuesta del servidor (PUT /gestion/estadias/{episodio}/{registroId}):', JSON.stringify(result, null, 2));
      
      // Recargar gestiones del episodio después de actualizar
      currentEpisodioRef.current = null; // Reset para forzar recarga
      await fetchGestiones(episodio);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al actualizar gestión';
      setError(errorMessage);
      console.error('❌ Error al actualizar gestión:', errorMessage);
      throw err; // Re-lanzar para que el componente pueda manejar el error
    } finally {
      setLoading(false);
    }
  }, [fetchGestiones]);

  /**
   * Elimina una gestión existente
   * @param episodio - Episodio del paciente
   * @param registroId - marca_temporal de la gestión a eliminar
   */
  const deleteGestion = useCallback(async (episodio: string, registroId: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = apiUrls.deleteGestion(episodio, registroId);
      console.log('🔄 Eliminando gestión:', { episodio, registroId });
      console.log('🔗 URL completa:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('❌ Error del servidor al eliminar gestión:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          episodio,
          registroId
        });
        throw new Error(`Error del servidor: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json().catch(() => ({}));
      console.log('✅ Gestión eliminada exitosamente');
      console.log('📥 Respuesta del servidor (DELETE /gestion/estadias/{episodio}/{registroId}):', JSON.stringify(result, null, 2));
      
      // Recargar gestiones del episodio después de eliminar
      currentEpisodioRef.current = null; // Reset para forzar recarga
      await fetchGestiones(episodio);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al eliminar gestión';
      setError(errorMessage);
      console.error('❌ Error al eliminar gestión:', errorMessage);
      throw err; // Re-lanzar para que el componente pueda manejar el error
    } finally {
      setLoading(false);
    }
  }, [fetchGestiones]);

  return {
    gestiones,
    loading,
    error,
    episodio,
    fetchGestiones,
    createGestion,
    updateGestion,
    deleteGestion,
    clearError,
    getGestionesByTipo,
    refreshGestiones,
  };
};

