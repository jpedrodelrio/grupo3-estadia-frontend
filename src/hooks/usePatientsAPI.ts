import { useState, useEffect, useCallback } from 'react';

// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface PatientAPIResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  lastModified: string;
}

export interface PatientStats {
  total: number;
  activos: number;
  alta_pendiente: number;
  dados_alta: number;
  riesgo_verde: number;
  riesgo_amarillo: number;
  riesgo_rojo: number;
  hombres: number;
  mujeres: number;
  servicios_unicos: number;
  edad_promedio: number;
  estancia_promedio: number;
}

export interface PatientFilters {
  page?: number;
  limit?: number;
  search?: string;
  service?: string;
  risk?: string;
  status?: string;
  age_min?: number;
  age_max?: number;
}

// Hook para obtener pacientes desde la API
export const usePatientsAPI = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPatients = useCallback(async (filters: PatientFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.service) params.append('service', filters.service);
      if (filters.risk) params.append('risk', filters.risk);
      if (filters.status) params.append('status', filters.status);
      if (filters.age_min) params.append('age_min', filters.age_min.toString());
      if (filters.age_max) params.append('age_max', filters.age_max.toString());

      const response = await fetch(`${API_BASE_URL}/patients?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: PatientAPIResponse = await response.json();
      
      setPatients(data.patients);
      setTotal(data.total);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientById = useCallback(async (id: string): Promise<Patient | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const patient = await response.json();
      return patient;
    } catch (err) {
      console.error('Error fetching patient by ID:', err);
      return null;
    }
  }, []);

  const reloadData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reload`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Datos recargados:', data);
      
      // Recargar pacientes después de recargar datos
      await fetchPatients({ page: currentPage });
      
      return data;
    } catch (err) {
      console.error('Error reloading data:', err);
      throw err;
    }
  }, [fetchPatients, currentPage]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchPatients({ page: 1, limit: 50 });
  }, [fetchPatients]);

  return {
    patients,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    fetchPatients,
    fetchPatientById,
    reloadData,
    setCurrentPage
  };
};

// Hook para obtener estadísticas
export const usePatientStats = () => {
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/stats`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: PatientStats = await response.json();
      setStats(data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

// Hook para obtener servicios únicos
export const useServices = () => {
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/services`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: string[] = await response.json();
      setServices(data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices
  };
};

// Hook para verificar salud del servidor
export const useServerHealth = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [healthData, setHealthData] = useState<any>(null);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`Server not healthy: ${response.status}`);
      }

      const data = await response.json();
      setHealthData(data);
      setIsHealthy(true);
      
    } catch (err) {
      console.error('Server health check failed:', err);
      setIsHealthy(false);
      setHealthData(null);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Verificar salud cada 30 segundos
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isHealthy,
    healthData,
    checkHealth
  };
};

// Hook para obtener episodios de gestión por paciente
export const usePatientGestion = (episodioCmbd: string) => {
  const [episodios, setEpisodios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchEpisodios = useCallback(async () => {
    if (!episodioCmbd) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/patient/${episodioCmbd}/gestion`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setEpisodios(data.episodios);
      setTotal(data.total);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching patient gestion:', err);
    } finally {
      setLoading(false);
    }
  }, [episodioCmbd]);

  useEffect(() => {
    fetchEpisodios();
  }, [fetchEpisodios]);

  return {
    episodios,
    loading,
    error,
    total,
    refetch: fetchEpisodios
  };
};

// Hook para enviar CSV al backend real
export const useCSVUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const uploadCSV = useCallback(async (csvData: string, filename?: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Usar el endpoint proxy local para evitar CORS
      const response = await fetch(`${API_BASE_URL}/proxy-upload-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          filename
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      setSuccess(true);
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error uploading CSV:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploadCSV,
    loading,
    error,
    success,
    reset: () => {
      setError(null);
      setSuccess(false);
    }
  };
};
