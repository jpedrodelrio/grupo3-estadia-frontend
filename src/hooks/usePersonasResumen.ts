import { useState, useCallback } from 'react';
import { PersonaResumen, PersonasResumenResponse } from '../types';
import { apiUrls } from '../config/api';

export interface UsePersonasResumenState {
  personas: PersonaResumen[];
  loading: boolean;
  error: string | null;
  count: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

export interface UsePersonasResumenActions {
  fetchPersonasResumen: (page?: number, limit?: number) => Promise<void>;
  getPersonaByEpisodio: (episodio: string) => PersonaResumen | undefined;
  clearError: () => void;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
}

export const usePersonasResumen = (): UsePersonasResumenState & UsePersonasResumenActions => {
  const [personas, setPersonas] = useState<PersonaResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Calcular valores derivados
  const totalPages = Math.ceil(count / limit);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const fetchPersonasResumen = useCallback(async (page: number = 1, limit: number = 10000) => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar todos los datos con el límite especificado
      const url = apiUrls.personasResumen(page, limit);
      console.log('🔄 Cargando TODOS los pacientes...', { page, limit, url });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const data: PersonasResumenResponse = await response.json();
      
      console.log('📦 Datos recibidos del servidor:', {
        count: data.count,
        resultsLength: data.results?.length || 0,
        firstResult: data.results?.[0] || null
      });
      
      setPersonas(data.results || []);
      setCount(data.count || 0);
      setCurrentPage(page);
      setLimit(limit);
      
      console.log('✅ Todos los datos de personas resumen cargados:', {
        totalCount: data.count,
        personasCargadas: data.results?.length || 0,
        url
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar datos';
      setError(errorMessage);
      console.error('❌ Error al cargar personas resumen:', errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPersonaByEpisodio = useCallback((episodio: string): PersonaResumen | undefined => {
    return personas.find(persona => persona.episodio === episodio);
  }, [personas]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const nextPage = useCallback(async () => {
    if (hasNextPage) {
      await fetchPersonasResumen();
    }
  }, [hasNextPage, currentPage, limit, fetchPersonasResumen]);

  const previousPage = useCallback(async () => {
    if (hasPreviousPage) {
      await fetchPersonasResumen();
    }
  }, [hasPreviousPage, currentPage, limit, fetchPersonasResumen]);

  const goToPage = useCallback(async (page: number) => {
    if (page >= 1 && page <= totalPages) {
      await fetchPersonasResumen();
    }
  }, [totalPages, limit, fetchPersonasResumen]);

  return {
    personas,
    loading,
    error,
    count,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    limit,
    fetchPersonasResumen,
    getPersonaByEpisodio,
    clearError,
    nextPage,
    previousPage,
    goToPage,
  };
};
