import { useState, useCallback, useMemo } from 'react';
import { GestionesResumenResponse, GestionesEpisodio, RegistroGestion } from '../types';
import { apiUrls } from '../config/api';

export interface UseGestionesResumenReturn {
  episodios: GestionesEpisodio[];
  loading: boolean;
  error: string | null;
  fetchAllGestiones: () => Promise<void>;
  getRegistrosByEpisodio: (episodio: string) => RegistroGestion[];
  gestionTypes: string[];
  diagnosticoOptions: string[];
}

export const useGestionesResumen = (): UseGestionesResumenReturn => {
  const [episodios, setEpisodios] = useState<GestionesEpisodio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllGestiones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = apiUrls.gestionesEpisodios(''); // sin episodio -> todos
      const requestUrl = url.replace('?episodio=', '');
      const resp = await fetch(requestUrl, { headers: { 'Content-Type': 'application/json' } });
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const data: GestionesResumenResponse = await resp.json();
      setEpisodios(data.results || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setEpisodios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRegistrosByEpisodio = useCallback((episodio: string) => {
    const item = episodios.find(e => e.episodio === episodio);
    return item ? item.registros : [];
  }, [episodios]);

  const gestionTypes = useMemo(() => {
    const set = new Set<string>();
    episodios.forEach(e => e.registros.forEach(r => { if (r.que_gestion_se_solicito) set.add(r.que_gestion_se_solicito); }));
    return Array.from(set).sort();
  }, [episodios]);

  const diagnosticoOptions = useMemo(() => {
    const set = new Set<string>();
    episodios.forEach(e => e.registros.forEach(r => {
      const diag = r.texto_libre_diagnostico_admision;
      if (diag && diag !== '#N/D') set.add(diag);
    }));
    return Array.from(set).sort();
  }, [episodios]);

  return {
    episodios,
    loading,
    error,
    fetchAllGestiones,
    getRegistrosByEpisodio,
    gestionTypes,
    diagnosticoOptions,
  };
};
