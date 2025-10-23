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
import { ExcelUploadModal } from './components/Modals/ExcelUploadModal';
import { DualExcelUploadModal } from './components/Modals/DualExcelUploadModal';
import { Patient, Task, PatientNote } from './types';
// import { useSupabase } from './hooks/useSupabase';
import { usePatientsAPI, usePatientStats } from './hooks/usePatientsAPI';

function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'patients' | 'tasks' | 'predictions'>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showDualExcelModal, setShowDualExcelModal] = useState(false);
  
  // Estado para controlar si usar datos de API
  const [useAPIData, setUseAPIData] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // const { getPatients } = useSupabase();
  
  // Hooks para datos de API
  const { patients: apiPatients, loading: apiLoading, error: apiError } = usePatientsAPI();
  const { stats: apiStats, loading: statsLoading } = usePatientStats();

  useEffect(() => {
    loadPatients();
    loadSampleTasks();
  }, []);

  useEffect(() => {
    if (!useAPIData) {
      applyFilters();
    }
  }, [patients, searchTerm, serviceFilter, riskFilter, statusFilter, useAPIData]);

  const loadPatients = async () => {
    setLoading(true);
    // const patientsData = await getPatients();
    
    // Usar datos de ejemplo directamente ya que Supabase no está configurado
    const patientsData: Patient[] = [];
      const samplePatients: Patient[] = [
        {
          id: '1',
          rut: '12.345.678-9',
          nombre: 'María',
          apellido_paterno: 'González',
          apellido_materno: 'López',
          edad: 65,
          sexo: 'F',
          servicio_clinico: 'Medicina Interna',
          fecha_ingreso: '2025-01-01T08:00:00Z',
          fecha_estimada_alta: '2025-01-15T12:00:00Z',
          dias_hospitalizacion: 13,
          diagnostico_principal: 'Neumonía adquirida en la comunidad con insuficiencia respiratoria aguda',
          riesgo_social: 'alto',
          riesgo_clinico: 'medio',
          riesgo_administrativo: 'bajo',
          nivel_riesgo_global: 'rojo',
          estado: 'activo',
          prevision: 'FONASA A',
          created_at: '2025-01-01T08:00:00Z',
          updated_at: '2025-01-13T10:30:00Z',
        },
        {
          id: '2',
          rut: '98.765.432-1',
          nombre: 'Pedro',
          apellido_paterno: 'Martínez',
          apellido_materno: 'Silva',
          edad: 58,
          sexo: 'M',
          servicio_clinico: 'Cardiología',
          fecha_ingreso: '2025-01-05T14:00:00Z',
          fecha_estimada_alta: '2025-01-18T10:00:00Z',
          dias_hospitalizacion: 9,
          diagnostico_principal: 'Infarto agudo del miocardio con elevación del segmento ST',
          riesgo_social: 'medio',
          riesgo_clinico: 'alto',
          riesgo_administrativo: 'medio',
          nivel_riesgo_global: 'rojo',
          estado: 'activo',
          prevision: 'ISAPRE',
          created_at: '2025-01-05T14:00:00Z',
          updated_at: '2025-01-13T16:20:00Z',
        },
        {
          id: '3',
          rut: '15.678.234-5',
          nombre: 'Ana',
          apellido_paterno: 'López',
          apellido_materno: 'Hernández',
          edad: 42,
          sexo: 'F',
          servicio_clinico: 'Cirugía',
          fecha_ingreso: '2025-01-08T09:30:00Z',
          fecha_estimada_alta: '2025-01-16T14:00:00Z',
          dias_hospitalizacion: 6,
          diagnostico_principal: 'Apendicitis aguda complicada con peritonitis localizada',
          riesgo_social: 'bajo',
          riesgo_clinico: 'bajo',
          riesgo_administrativo: 'alto',
          nivel_riesgo_global: 'amarillo',
          estado: 'alta_pendiente',
          prevision: 'FONASA C',
          created_at: '2025-01-08T09:30:00Z',
          updated_at: '2025-01-13T11:45:00Z',
        },
        {
          id: '4',
          rut: '87.654.321-9',
          nombre: 'Carlos',
          apellido_paterno: 'Ramírez',
          apellido_materno: 'Torres',
          edad: 73,
          sexo: 'M',
          servicio_clinico: 'UCI',
          fecha_ingreso: '2024-12-28T20:15:00Z',
          fecha_estimada_alta: '2025-01-20T08:00:00Z',
          dias_hospitalizacion: 17,
          diagnostico_principal: 'Shock séptico secundario a infección intraabdominal',
          riesgo_social: 'medio',
          riesgo_clinico: 'alto',
          riesgo_administrativo: 'medio',
          nivel_riesgo_global: 'rojo',
          estado: 'activo',
          prevision: 'FONASA B',
          created_at: '2024-12-28T20:15:00Z',
          updated_at: '2025-01-13T18:00:00Z',
        },
        {
          id: '5',
          rut: '45.123.678-2',
          nombre: 'Luisa',
          apellido_paterno: 'Morales',
          apellido_materno: 'Castillo',
          edad: 34,
          sexo: 'F',
          servicio_clinico: 'Ginecología',
          fecha_ingreso: '2025-01-10T11:00:00Z',
          fecha_estimada_alta: '2025-01-14T16:00:00Z',
          dias_hospitalizacion: 4,
          diagnostico_principal: 'Parto por cesárea sin complicaciones',
          riesgo_social: 'bajo',
          riesgo_clinico: 'bajo',
          riesgo_administrativo: 'bajo',
          nivel_riesgo_global: 'verde',
          estado: 'activo',
          prevision: 'ISAPRE',
          created_at: '2025-01-10T11:00:00Z',
          updated_at: '2025-01-13T09:30:00Z',
        },
        {
          id: '6',
          rut: '23.456.789-0',
          nombre: 'Roberto',
          apellido_paterno: 'Vásquez',
          apellido_materno: 'Mendoza',
          edad: 67,
          sexo: 'M',
          servicio_clinico: 'Traumatología',
          fecha_ingreso: '2025-01-07T16:45:00Z',
          fecha_estimada_alta: '2025-01-17T12:00:00Z',
          dias_hospitalizacion: 7,
          diagnostico_principal: 'Fractura de cadera izquierda con artroplastia total',
          riesgo_social: 'alto',
          riesgo_clinico: 'medio',
          riesgo_administrativo: 'bajo',
          nivel_riesgo_global: 'amarillo',
          estado: 'activo',
          prevision: 'FONASA D',
          created_at: '2025-01-07T16:45:00Z',
          updated_at: '2025-01-13T14:15:00Z',
        },
      ];
      setPatients(samplePatients);
    
    setLoading(false);
  };

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
        patient.diagnostico_principal.toLowerCase().includes(searchLower)
      );
    }

    // Service filter
    if (serviceFilter) {
      filtered = filtered.filter(patient => patient.servicio_clinico === serviceFilter);
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
    setPatients([newPatient, ...patients]);
  };

  const handleExcelImport = (importedPatients: Patient[]) => {
    setPatients([...importedPatients, ...patients]);
  };

  const handleDualExcelImport = (importedPatients: Patient[], importedNotes: PatientNote[]) => {
    setPatients([...importedPatients, ...patients]);
    // Las notas se guardarán automáticamente en Supabase
    console.log(`Importados ${importedPatients.length} pacientes y ${importedNotes.length} gestiones`);
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

  const alertCount = patients.filter(p => p.nivel_riesgo_global === 'rojo').length;

  if (loading) {
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
        onOpenExcelModal={() => setShowExcelModal(true)}
        onOpenDualExcelModal={() => setShowDualExcelModal(true)}
        alertCount={alertCount}
        useAPIData={useAPIData}
        onToggleAPIData={() => setUseAPIData(!useAPIData)}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <FilterPanel
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  serviceFilter={serviceFilter}
                  onServiceFilterChange={setServiceFilter}
                  riskFilter={riskFilter}
                  onRiskFilterChange={setRiskFilter}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
              </div>
              <div>
                <AlertsPanel />
              </div>
            </div>

            <PatientTable
              patients={useAPIData ? undefined : filteredPatients}
              onViewPatient={handleViewPatient}
              useAPIData={useAPIData}
              filters={{
                search: searchTerm,
                service: serviceFilter,
                risk: riskFilter,
                status: statusFilter
              }}
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

      <ExcelUploadModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onPatientsImported={handleExcelImport}
      />

      <DualExcelUploadModal
        isOpen={showDualExcelModal}
        onClose={() => setShowDualExcelModal(false)}
        onPatientsImported={handleDualExcelImport}
      />
    </div>
  );
}

export default App;