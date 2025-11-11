/**
 * Hook personalizado para manejo de gestiones de pacientes
 * Encapsula la lógica de carga de gestiones desde el endpoint
 */

import { useState, useCallback, useRef } from 'react';
import { RegistroGestion, GestionesResumenResponse, UseGestionesState } from '../types';
import { apiUrls } from '../config/api';

export interface UseGestionesReturn extends UseGestionesState {
  fetchGestiones: (episodio: string) => Promise<void>;
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

  return {
    gestiones,
    loading,
    error,
    episodio,
    fetchGestiones,
    clearError,
    getGestionesByTipo,
    refreshGestiones,
  };
};

