import { useState, useCallback, useEffect } from 'react';
import { Gestora, CreateGestoraRequest } from '../types';
import { apiUrls } from '../config/api';

export interface UseGestorasReturn {
  gestoras: Gestora[];
  loading: boolean;
  error: string | null;
  fetchGestoras: () => Promise<void>;
  createGestora: (name: string) => Promise<Gestora | null>;
  refreshGestoras: () => Promise<void>;
}

export const useGestoras = (): UseGestorasReturn => {
  const [gestoras, setGestoras] = useState<Gestora[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGestoras = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = apiUrls.gestoras();
      console.log('🔄 Cargando gestoras desde:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();
      
      if (!response.ok) {
        // Si la respuesta es HTML, probablemente es un error 404 o del servidor
        if (text.trim().startsWith('<!')) {
          throw new Error(`Error del servidor: El endpoint no está disponible (${response.status})`);
        }
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      // Intentar parsear como JSON
      let data: Gestora[];
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Error: El servidor devolvió una respuesta inválida');
      }
      
      setGestoras(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar gestoras';
      setError(errorMessage);
      console.error('❌ Error al cargar gestoras:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGestora = useCallback(async (name: string): Promise<Gestora | null> => {
    setLoading(true);
    setError(null);

    try {
      const url = apiUrls.gestoras();
      console.log('🔄 Creando gestora en:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name } as CreateGestoraRequest),
      });

      const text = await response.text();
      
      if (response.status === 409) {
        throw new Error('El nombre de la gestora ya existe');
      }

      if (!response.ok) {
        // Si la respuesta es HTML, probablemente es un error 404 o del servidor
        if (text.trim().startsWith('<!')) {
          throw new Error(`Error del servidor: El endpoint no está disponible (${response.status})`);
        }
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      // Intentar parsear como JSON
      let newGestora: Gestora;
      try {
        newGestora = JSON.parse(text);
      } catch {
        throw new Error('Error: El servidor devolvió una respuesta inválida');
      }
      
      // Agregar la nueva gestora a la lista
      setGestoras(prev => [...prev, newGestora]);
      
      return newGestora;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear gestora';
      setError(errorMessage);
      console.error('❌ Error al crear gestora:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshGestoras = useCallback(async () => {
    await fetchGestoras();
  }, [fetchGestoras]);

  // Cargar gestoras al montar el componente
  useEffect(() => {
    fetchGestoras();
  }, [fetchGestoras]);

  return {
    gestoras,
    loading,
    error,
    fetchGestoras,
    createGestora,
    refreshGestoras,
  };
};

