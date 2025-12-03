import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Layout/Header';
import { StatsCards } from './components/Dashboard/StatsCards';
import { OperationalDashboard } from './components/Dashboard/OperationalDashboard';
import { TaskManagement } from './components/Dashboard/TaskManagement';
// Ocultado temporalmente
// import { SocialRiskPredictor } from './components/Dashboard/SocialRiskPredictor';
import { AlertsPanel } from './components/Dashboard/AlertsPanel';
import { FilterPanel } from './components/Dashboard/FilterPanel';
import { PatientTable } from './components/Dashboard/PatientTable';
import { PatientDetailModal } from './components/Modals/PatientDetailModal';
import { NewPatientModal } from './components/Modals/NewPatientModal';
import { UploadModal } from './components/Modals/UploadModal';
import { Patient, Task } from './types';
import { usePatients } from './hooks/usePatients';
import { useGestionesResumen } from './hooks/useGestionesResumen';
import { useTasks, TaskFilters } from './hooks/useTasks';

function App() {
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

  // Hook tareas (API)
  const {
    tasks: tasksFromAPI,
    fetchTasks,
    createTask: createTaskAPI,
    updateTask: updateTaskAPI,
    deleteTask: deleteTaskAPI,
    loading: tasksLoading,
    error: tasksError,
  } = useTasks();

  // Ref para evitar cargar tareas múltiples veces
  const hasLoadedTasksRef = useRef(false);

  // Cargar tareas solo una vez al montar el componente
  useEffect(() => {
    if (!hasLoadedTasksRef.current) {
      hasLoadedTasksRef.current = true;
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío para ejecutar solo una vez

  useEffect(() => {
    fetchAllGestiones();
  }, [fetchAllGestiones]);

  useEffect(() => {
    applyFilters();
  }, [patients, searchTerm, convenienceFilter, riskFilter, statusFilter, gestionTypeFilter, diagnosticoFilter, episodios]);


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

  const handleCreateTask = async (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> => {
    // Llamar al API para crear la tarea
    const createdTask = await createTaskAPI({
      paciente_episodio: newTask.paciente_episodio,
      gestor: newTask.gestor,
      tipo: newTask.tipo,
      prioridad: newTask.prioridad,
      titulo: newTask.titulo,
      status: newTask.status,
      rol: newTask.rol,
      descripcion: newTask.descripcion,
      fecha_inicio: newTask.fecha_inicio,
      fecha_vencimiento: newTask.fecha_vencimiento,
    });

    if (createdTask) {
      // Recargar TODAS las tareas sin filtros para que aparezcan en el dashboard
      await fetchTasks();
      return createdTask;
    } else {
      // Si hay error, se maneja en el hook useTasks
      console.error('Error al crear tarea:', tasksError);
      return null;
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    // Llamar al API para actualizar la tarea
    const updatedTask = await updateTaskAPI(taskId, {
      paciente_episodio: updates.paciente_episodio,
      gestor: updates.gestor,
      tipo: updates.tipo,
      prioridad: updates.prioridad,
      titulo: updates.titulo,
      status: updates.status,
      rol: updates.rol,
      descripcion: updates.descripcion,
      fecha_inicio: updates.fecha_inicio,
      fecha_vencimiento: updates.fecha_vencimiento,
    });

    if (updatedTask) {
      // Recargar TODAS las tareas sin filtros para que se actualicen en el dashboard
      await fetchTasks();
    } else {
      // Si hay error, se maneja en el hook useTasks
      console.error('Error al actualizar tarea:', tasksError);
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<boolean> => {
    // Llamar al API para eliminar la tarea
    const deleted = await deleteTaskAPI(taskId);

    if (deleted) {
      // Recargar TODAS las tareas sin filtros para que se actualicen en el dashboard
      await fetchTasks();
      return true;
    } else {
      // Si hay error, se maneja en el hook useTasks
      console.error('Error al eliminar tarea:', tasksError);
      return false;
    }
  };

  // Memoizar la función de cambio de filtros para evitar loops
  const handleFiltersChange = useCallback(async (filters: TaskFilters) => {
    await fetchTasks(filters);
  }, [fetchTasks]);

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
            {/* Ocultado temporalmente */}
            {/* <button
              onClick={() => setActiveView('predictions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'predictions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Predicción de Riesgo Social
            </button> */}
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
            <OperationalDashboard patients={patients} tasks={tasksFromAPI} />
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
            tasks={tasksFromAPI}
            patients={patients}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onFiltersChange={handleFiltersChange}
            loading={tasksLoading}
          />
        )}

        {/* Ocultado temporalmente */}
        {/* {activeView === 'predictions' && (
          <SocialRiskPredictor patients={patients} />
        )} */}
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