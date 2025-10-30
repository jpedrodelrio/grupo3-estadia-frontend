/**
 * Hook personalizado para manejo de pacientes
 * Encapsula toda la lógica de carga y conversión de datos
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Patient } from '../types';
import { usePersonasResumen } from './usePersonasResumen';
import { PatientService } from '../services/PatientService';

interface UsePatientsReturn {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
  loadPatients: (page?: number, limit?: number) => Promise<void>;
  refreshPatients: () => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  removePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  getPatientsByStatus: (status: 'activo' | 'alta_pendiente' | 'dado_alta') => Patient[];
  getPatientsByRiskLevel: (level: 'verde' | 'amarillo' | 'rojo') => Patient[];
  getPatientStats: () => {
    total: number;
    activos: number;
    dadosAlta: number;
    altaPendiente: number;
    riesgoVerde: number;
    riesgoAmarillo: number;
    riesgoRojo: number;
  };
}

export const usePatients = (): UsePatientsReturn => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para evitar cargas repetidas
  const hasInitialLoadRef = useRef<boolean>(false);

  const { 
    personas, 
    fetchPersonasResumen, 
    loading: personasLoading, 
    error: personasError,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    count: totalCount,
    nextPage: personasNextPage,
    previousPage: personasPreviousPage,
    goToPage: personasGoToPage,
  } = usePersonasResumen();

  /**
   * Carga pacientes desde diferentes fuentes con prioridad al endpoint
   * Carga TODOS los pacientes de una vez (sin paginación)
   */
  const loadPatients = useCallback(async (page: number = 1, limit: number = 1000) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Cargando TODOS los pacientes del endpoint...');
      await fetchPersonasResumen(page, limit);
    } catch (err) {
      console.error('Error loading personas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar personas');
    } finally {
      setLoading(false);
    }
  }, [fetchPersonasResumen]);

  /**
   * Recarga los pacientes
   */
  const refreshPatients = useCallback(async () => {
    console.log('🔄 Recargando pacientes manualmente...');
    await loadPatients(currentPage);
  }, [loadPatients, currentPage]);

  /**
   * Navega a la siguiente página
   */
  const nextPage = useCallback(async () => {
    await personasNextPage();
  }, [personasNextPage]);

  /**
   * Navega a la página anterior
   */
  const previousPage = useCallback(async () => {
    await personasPreviousPage();
  }, [personasPreviousPage]);

  /**
   * Va a una página específica
   */
  const goToPage = useCallback(async (page: number) => {
    await personasGoToPage(page);
  }, [personasGoToPage]);

  /**
   * Agrega un nuevo paciente
   */
  const addPatient = useCallback((patient: Patient) => {
    setPatients(prev => [patient, ...prev]);
  }, []);

  /**
   * Actualiza un paciente existente
   */
  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(patient => 
      patient.id === id 
        ? { ...patient, ...updates, updated_at: new Date().toISOString() }
        : patient
    ));
  }, []);

  /**
   * Elimina un paciente
   */
  const removePatient = useCallback((id: string) => {
    setPatients(prev => prev.filter(patient => patient.id !== id));
  }, []);

  /**
   * Obtiene un paciente por ID
   */
  const getPatientById = useCallback((id: string): Patient | undefined => {
    return patients.find(patient => patient.id === id);
  }, [patients]);

  /**
   * Obtiene pacientes por estado
   */
  const getPatientsByStatus = useCallback((status: 'activo' | 'alta_pendiente' | 'dado_alta'): Patient[] => {
    return patients.filter(patient => patient.estado === status);
  }, [patients]);

  /**
   * Obtiene pacientes por nivel de riesgo
   */
  const getPatientsByRiskLevel = useCallback((level: 'verde' | 'amarillo' | 'rojo'): Patient[] => {
    return PatientService.getPatientsByRiskLevel(patients, level);
  }, [patients]);

  /**
   * Calcula estadísticas de pacientes
   */
  const getPatientStats = useCallback(() => {
    return PatientService.calculatePatientStats(patients);
  }, [patients]);

  // Cargar pacientes solo una vez al montar el componente
  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      console.log('🚀 Cargando pacientes por primera vez...');
      hasInitialLoadRef.current = true;
      loadPatients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencias vacías para ejecutar solo al montar

  // Convertir personas a pacientes cuando lleguen los datos
  useEffect(() => {
    if (personas.length > 0) {
      console.log(`🔄 Convirtiendo ${personas.length} personas a pacientes...`);
      const convertedPatients = PatientService.convertPersonasToPatients(personas);
      console.log(`✅ Convertidos ${convertedPatients.length} pacientes del endpoint`);
      setPatients(convertedPatients);
    }
  }, [personas]);

  // Manejar errores del hook de personas
  useEffect(() => {
    if (personasError) {
      setError(personasError);
    }
  }, [personasError]);

  return {
    patients,
    loading: loading || personasLoading,
    error,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    totalCount,
    loadPatients,
    refreshPatients,
    nextPage,
    previousPage,
    goToPage,
    addPatient,
    updatePatient,
    removePatient,
    getPatientById,
    getPatientsByStatus,
    getPatientsByRiskLevel,
    getPatientStats,
  };
};
