import { useState, useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { StatsCards } from './components/Dashboard/StatsCards';
import { OperationalDashboard } from './components/Dashboard/OperationalDashboard';
import { TaskManagement } from './components/Dashboard/TaskManagement';
import { SocialRiskPredictor } from './components/Dashboard/SocialRiskPredictor';
import { AlertsPanel } from './components/Dashboard/AlertsPanel';
import { FilterPanel } from './components/Dashboard/FilterPanel';
import { PatientTable } from './components/Dashboard/PatientTable';
import { PatientDetailModal } from './components/Modals/PatientDetailModal';
import { NewPatientModal } from './components/Modals/NewPatientModal';
import { UploadModal } from './components/Modals/UploadModal';
import { Patient, Task } from './types';
import { usePatients } from './hooks/usePatients';
import { useGestionesResumen } from './hooks/useGestionesResumen';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'patients' | 'tasks' | 'predictions'>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [convenienceFilter, setConvenienceFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gestionTypeFilter, setGestionTypeFilter] = useState('');
  const [diagnosticoFilter, setDiagnosticoFilter] = useState('');

  // Hook pacientes
  const {
    patients,
    loading,
    addPatient,
    getPatientStats,
  } = usePatients();

  // Hook gestiones
  const {
    episodios,
    loading: gestionesLoading,
    fetchAllGestiones,
    getRegistrosByEpisodio,
    gestionTypes,
    diagnosticoOptions,
  } = useGestionesResumen();

  useEffect(() => {
    loadSampleTasks();
  }, []);

  useEffect(() => {
    fetchAllGestiones();
  }, [fetchAllGestiones]);

  useEffect(() => {
    applyFilters();
  }, [patients, searchTerm, convenienceFilter, riskFilter, statusFilter, gestionTypeFilter, diagnosticoFilter, episodios]);

  const loadSampleTasks = () => {
    // Datos de ejemplo para tareas
    const sampleTasks: Task[] = [
      {
        id: '1',
        patient_id: '1',
        assigned_to: 'María Rodríguez',
        assigned_role: 'trabajador_social',
        tipo_tarea: 'social' as const,
        titulo: 'Evaluación socioeconómica urgente',
        descripcion: 'Paciente de 65 años requiere evaluación de condiciones habitacionales y red de apoyo familiar para planificar alta.',
        prioridad: 'alta' as const,
        estado: 'pendiente' as const,
        fecha_vencimiento: '2025-01-15T12:00:00Z',
        created_at: '2025-01-13T08:00:00Z',
        updated_at: '2025-01-13T08:00:00Z',
      },
      {
        id: '2',
        patient_id: '2',
        assigned_to: 'Dr. Carlos Mendoza',
        assigned_role: 'jefe_servicio',
        tipo_tarea: 'clinica' as const,
        titulo: 'Revisión de protocolo post-infarto',
        descripcion: 'Evaluar evolución clínica y definir plan de rehabilitación cardíaca ambulatoria.',
        prioridad: 'alta' as const,
        estado: 'en_progreso' as const,
        fecha_vencimiento: '2025-01-16T10:00:00Z',
        created_at: '2025-01-12T14:00:00Z',
        updated_at: '2025-01-13T09:30:00Z',
      },
      {
        id: '3',
        patient_id: '3',
        assigned_to: 'Ana Morales',
        assigned_role: 'analista',
        tipo_tarea: 'administrativa' as const,
        titulo: 'Verificación de cobertura FONASA',
        descripcion: 'Confirmar cobertura para procedimientos post-quirúrgicos y medicamentos de alta.',
        prioridad: 'media' as const,
        estado: 'completada' as const,
        fecha_vencimiento: '2025-01-14T16:00:00Z',
        created_at: '2025-01-11T11:00:00Z',
        updated_at: '2025-01-13T15:45:00Z',
      },
      {
        id: '4',
        patient_id: '4',
        assigned_to: 'Equipo Multidisciplinario',
        assigned_role: 'gestor_estadia',
        tipo_tarea: 'coordinacion' as const,
        titulo: 'Coordinación alta compleja UCI',
        descripcion: 'Coordinar con familia, trabajo social y equipo médico para alta segura de paciente crítico.',
        prioridad: 'critica' as const,
        estado: 'pendiente' as const,
        fecha_vencimiento: '2025-01-14T08:00:00Z',
        created_at: '2025-01-10T20:00:00Z',
        updated_at: '2025-01-13T18:00:00Z',
      },
    ];
    setTasks(sampleTasks);
  };

  const applyFilters = () => {
    let filtered = [...patients];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.nombre.toLowerCase().includes(searchLower) ||
        patient.apellido_paterno.toLowerCase().includes(searchLower) ||
        patient.apellido_materno.toLowerCase().includes(searchLower) ||
        patient.rut.includes(searchTerm) ||
        patient.episodio.includes(searchTerm) ||
        patient.diagnostico_principal.toLowerCase().includes(searchLower)
      );
    }

    // ISAPRE (aseguradora)
    if (convenienceFilter) {
      filtered = filtered.filter(patient => {
        const aseguradora = patient.nombre_de_la_aseguradora?.toUpperCase() || '';
        return aseguradora.includes(convenienceFilter.toUpperCase());
      });
    }

    // Gestión - por episodio
    if (gestionTypeFilter) {
      filtered = filtered.filter(patient => {
        const registros = getRegistrosByEpisodio(patient.episodio);
        return registros.some(r => r.que_gestion_se_solicito === gestionTypeFilter);
      });
    }

    // Diagnóstico desde episodios
    if (diagnosticoFilter) {
      filtered = filtered.filter(patient => {
        const registros = getRegistrosByEpisodio(patient.episodio);
        return registros.some(r => r.texto_libre_diagnostico_admision === diagnosticoFilter);
      });
    }

    // Risk filter
    if (riskFilter) {
      filtered = filtered.filter(patient => patient.nivel_riesgo_global === riskFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(patient => patient.estado === statusFilter);
    }

    setFilteredPatients(filtered);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handlePatientCreated = (newPatient: Patient) => {
    addPatient(newPatient);
  };

  const handleCreateTask = (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks([task, ...tasks]);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updated_at: new Date().toISOString() }
        : task
    ));
  };

  const alertCount = getPatientStats().riesgoRojo;

  if (loading || gestionesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900">Cargando sistema de gestión...</p>
          <p className="text-sm text-gray-500">Conectando con la base de datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onOpenUploadModal={() => setShowUploadModal(true)}
        onOpenNewPatientModal={() => setShowNewPatientModal(true)}
        alertCount={alertCount}
      />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard Operacional
            </button>
            <button
              onClick={() => setActiveView('patients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'patients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gestión de Pacientes
            </button>
            <button
              onClick={() => setActiveView('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Coordinación de Equipos
            </button>
            <button
              onClick={() => setActiveView('predictions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'predictions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Predicción de Riesgo Social
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Operacional</h1>
              <p className="mt-1 text-sm text-gray-600">
                Visibilidad en tiempo real del estado de pacientes, tareas y barreras de alta
              </p>
            </div>
            <OperationalDashboard patients={patients} tasks={tasks} />
          </>
        )}

        {activeView === 'patients' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Pacientes</h1>
              <p className="mt-1 text-sm text-gray-600">
                Tablero centralizado de pacientes hospitalizados con alertas tempranas
              </p>
            </div>

            <StatsCards patients={patients} />

            <FilterPanel
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              convenienceFilter={convenienceFilter}
              onConvenienceFilterChange={setConvenienceFilter}
              riskFilter={riskFilter}
              onRiskFilterChange={setRiskFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              patients={patients}
              gestionTypeFilter={gestionTypeFilter}
              onGestionTypeFilterChange={setGestionTypeFilter}
              diagnosticoFilter={diagnosticoFilter}
              onDiagnosticoFilterChange={setDiagnosticoFilter}
              gestionTypes={gestionTypes}
              diagnosticoOptions={diagnosticoOptions}
            />

            <div className="mb-6">
              <AlertsPanel />
            </div>

            <PatientTable
              patients={filteredPatients}
              onViewPatient={handleViewPatient}
              loading={loading}
            />
          </>
        )}

        {activeView === 'tasks' && (
          <TaskManagement
            tasks={tasks}
            patients={patients}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
          />
        )}

        {activeView === 'predictions' && (
          <SocialRiskPredictor patients={patients} />
        )}
      </main>

      <PatientDetailModal
        patient={selectedPatient}
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
      />

      <NewPatientModal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        onPatientCreated={handlePatientCreated}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
}

export default App;