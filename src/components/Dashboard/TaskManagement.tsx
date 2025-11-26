import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Clock, User, AlertTriangle, CheckCircle, Filter, Edit, Users } from 'lucide-react';
import { Task, Patient } from '../../types';
import { useGestoras } from '../../hooks/useGestoras';

interface TaskManagementProps {
  tasks: Task[];
  patients: Patient[];
  onCreateTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const TaskManagement: React.FC<TaskManagementProps> = ({
  tasks,
  patients,
  onCreateTask,
  onUpdateTask,
}) => {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showNewGestoraForm, setShowNewGestoraForm] = useState(false);
  const [newGestoraName, setNewGestoraName] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { gestoras, createGestora, loading: gestorasLoading, error: gestorasError } = useGestoras();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterGestor, setFilterGestor] = useState<string>('');
  const [filterEpisodio, setFilterEpisodio] = useState<string>('');
  const [episodioSearch, setEpisodioSearch] = useState<string>('');
  const [showEpisodioResults, setShowEpisodioResults] = useState<boolean>(false);
  const episodioSearchRef = useRef<HTMLDivElement>(null);
  const [newTask, setNewTask] = useState({
    paciente_episodio: '',
    gestor: '',
    rol: '',
    tipo: 'general' as const,
    prioridad: 'media' as const,
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_vencimiento: '',
    status: 'pendiente' as const,
  });

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (episodioSearchRef.current && !episodioSearchRef.current.contains(event.target as Node)) {
        setShowEpisodioResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (filterStatus && getTaskStatus(task) !== filterStatus) return false;
    if (filterRole && (task.rol || (task as any).assigned_role) !== filterRole) return false;
    if (filterGestor && getTaskGestor(task) !== filterGestor) return false;
    if (filterEpisodio && getTaskEpisodio(task) !== filterEpisodio) return false;
    return true;
  });

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica': return 'bg-red-100 text-red-800 border-red-200';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completada': return 'bg-green-100 text-green-800';
      case 'en_progreso': return 'bg-blue-100 text-blue-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper para obtener el status de una tarea (compatibilidad con tareas antiguas)
  const getTaskStatus = (task: Task): 'pendiente' | 'en_progreso' | 'completada' | 'cancelada' => {
    return (task.status || (task as any).estado || 'pendiente') as 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  };

  // Helper para obtener el episodio de una tarea (compatibilidad con tareas antiguas)
  const getTaskEpisodio = (task: Task): string => {
    return task.paciente_episodio || (task as any).patient_id || '';
  };

  // Helper para obtener el gestor de una tarea (compatibilidad con tareas antiguas)
  const getTaskGestor = (task: Task): string => {
    return task.gestor || (task as any).assigned_to || '';
  };

  const handleCreateTask = () => {
    if (!newTask.titulo || !newTask.paciente_episodio || !newTask.gestor) return;
    
    onCreateTask({
      ...newTask,
    });
    
    handleCloseNewTaskForm();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;
    const episodio = getTaskEpisodio(editingTask);
    const gestor = getTaskGestor(editingTask);
    if (!editingTask.titulo || !episodio || !gestor) return;

    onUpdateTask(editingTask.id, {
      paciente_episodio: episodio,
      gestor: gestor,
      rol: editingTask.rol || (editingTask as any).assigned_role || '',
      tipo: editingTask.tipo || (editingTask as any).tipo_tarea || 'general',
      prioridad: editingTask.prioridad || 'media',
      titulo: editingTask.titulo,
      descripcion: editingTask.descripcion || '',
      fecha_inicio: editingTask.fecha_inicio || '',
      fecha_vencimiento: editingTask.fecha_vencimiento || '',
      status: getTaskStatus(editingTask),
    });

    setEditingTask(null);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleCloseNewTaskForm = () => {
    setShowNewTaskForm(false);
    setEpisodioSearch('');
    setShowEpisodioResults(false);
    setNewTask({
      paciente_episodio: '',
      gestor: '',
      rol: '',
      tipo: 'general',
      prioridad: 'media',
      titulo: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_vencimiento: '',
      status: 'pendiente',
    });
  };

  const handleCreateGestora = async () => {
    if (!newGestoraName.trim()) return;
    
    const created = await createGestora(newGestoraName.trim());
    if (created) {
      setNewGestoraName('');
      setShowNewGestoraForm(false);
    }
  };

  const handleCloseNewGestoraForm = () => {
    setShowNewGestoraForm(false);
    setNewGestoraName('');
  };

  const getPatientName = (episodio: string) => {
    const patient = patients.find(p => p.episodio === episodio);
    return patient ? `${patient.nombre} ${patient.apellido_paterno}` : 'Paciente no encontrado';
  };

  // Filtrar pacientes para el searchbar de episodio
  const filteredPatientsForSearch = useMemo(() => {
    if (!episodioSearch.trim()) return [];
    const searchLower = episodioSearch.toLowerCase();
    return patients
      .filter(p => p.estado === 'activo')
      .filter(p => 
        p.episodio.toLowerCase().includes(searchLower) ||
        p.nombre.toLowerCase().includes(searchLower) ||
        p.apellido_paterno.toLowerCase().includes(searchLower) ||
        p.rut.toLowerCase().includes(searchLower)
      )
      .slice(0, 10); // Limitar a 10 resultados
  }, [episodioSearch, patients]);

  const handleEpisodioSelect = (episodio: string, nombre: string) => {
    setNewTask({...newTask, paciente_episodio: episodio});
    setEpisodioSearch(`${nombre} - ${episodio}`);
    setShowEpisodioResults(false);
  };

  // Lista única de gestores de todas las tareas
  const uniqueGestores = useMemo(() => {
    const gestores = tasks
      .map(task => getTaskGestor(task))
      .filter((gestor, index, self) => gestor && gestor.trim() !== '' && self.indexOf(gestor) === index)
      .sort();
    return gestores;
  }, [tasks]);

  // Lista única de episodios de todas las tareas
  const uniqueEpisodios = useMemo(() => {
    const episodios = tasks
      .map(task => getTaskEpisodio(task))
      .filter((episodio, index, self) => 
        episodio && 
        episodio.trim() !== '' && 
        self.indexOf(episodio) === index
      )
      .sort();
    
    return episodios;
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Header con filtros y botones */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h2>
          <p className="text-sm text-gray-600">Coordinación entre equipos clínicos y administrativos</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewGestoraForm(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Users className="h-4 w-4 mr-2" />
            Crear Gestora
          </button>
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En Progreso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los roles</option>
            <option value="gestor_estadia">Gestor de Estadía</option>
            <option value="trabajador_social">Trabajador Social</option>
            <option value="analista">Analista</option>
            <option value="jefe_servicio">Jefe de Servicio</option>
          </select>

          <select
            value={filterGestor}
            onChange={(e) => setFilterGestor(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los gestores</option>
            {uniqueGestores.map(gestor => (
              <option key={gestor} value={gestor}>
                {gestor}
              </option>
            ))}
          </select>

          <select
            value={filterEpisodio}
            onChange={(e) => setFilterEpisodio(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los episodios</option>
            {uniqueEpisodios.map(episodio => (
              <option key={episodio} value={episodio}>
                {episodio}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Tareas Asignadas ({filteredTasks.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredTasks.map((task) => {
            const taskStatus = getTaskStatus(task);
            const isOverdue = task.fecha_vencimiento && new Date(task.fecha_vencimiento) < new Date() && taskStatus === 'pendiente';
            
            return (
              <div key={task.id} className={`p-6 hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{task.titulo || 'Sin título'}</h4>
                      {task.prioridad && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.prioridad)}`}>
                          {task.prioridad.charAt(0).toUpperCase() + task.prioridad.slice(1)}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(taskStatus)}`}>
                        {taskStatus.replace('_', ' ').charAt(0).toUpperCase() + taskStatus.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                    
                    {task.descripcion && (
                      <p className="text-sm text-gray-600 mb-3">{task.descripcion}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>Paciente: {getPatientName(getTaskEpisodio(task))}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>Gestor: {getTaskGestor(task)}{task.rol && ` (${task.rol})`}</span>
                      </div>
                      {task.fecha_vencimiento && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            Vence: {new Date(task.fecha_vencimiento).toLocaleDateString('es-CL')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isOverdue && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    <button
                      onClick={() => handleEditTask(task)}
                      className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
                      title="Editar tarea"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    {taskStatus === 'pendiente' && (
                      <button
                        onClick={() => onUpdateTask(task.id, { status: 'en_progreso' })}
                        className="px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Iniciar
                      </button>
                    )}
                    {taskStatus === 'en_progreso' && (
                      <button
                        onClick={() => onUpdateTask(task.id, { status: 'completada' })}
                        className="px-3 py-1 text-sm border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors"
                      >
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filterStatus || filterRole || filterGestor || filterEpisodio 
                  ? 'No hay tareas que coincidan con los filtros.' 
                  : 'Comience creando una nueva tarea.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Tarea */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Nueva Tarea</h3>
              <button
                onClick={handleCloseNewTaskForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={episodioSearchRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Episodio del Paciente *</label>
                  <input
                    type="text"
                    value={episodioSearch}
                    onChange={(e) => {
                      setEpisodioSearch(e.target.value);
                      setShowEpisodioResults(true);
                      if (!e.target.value) {
                        setNewTask({...newTask, paciente_episodio: ''});
                      }
                    }}
                    onFocus={() => setShowEpisodioResults(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Buscar por episodio, nombre o RUT..."
                    required
                  />
                  {showEpisodioResults && filteredPatientsForSearch.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredPatientsForSearch.map(patient => (
                        <div
                          key={patient.episodio}
                          onClick={() => handleEpisodioSelect(patient.episodio, `${patient.nombre} ${patient.apellido_paterno}`)}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{patient.nombre} {patient.apellido_paterno}</div>
                          <div className="text-sm text-gray-500">RUT: {patient.rut} | Episodio: {patient.episodio}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showEpisodioResults && episodioSearch && filteredPatientsForSearch.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500">
                      No se encontraron pacientes
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gestor *</label>
                  <select
                    value={newTask.gestor}
                    onChange={(e) => setNewTask({...newTask, gestor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar gestor</option>
                    {gestoras.map(gestora => (
                      <option key={gestora.id} value={gestora.name}>
                        {gestora.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol (opcional)</label>
                  <input
                    type="text"
                    value={newTask.rol}
                    onChange={(e) => setNewTask({...newTask, rol: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Coordinadora"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={newTask.tipo}
                    onChange={(e) => setNewTask({...newTask, tipo: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="general">General</option>
                    <option value="social">Social</option>
                    <option value="clinica">Clínica</option>
                    <option value="administrativa">Administrativa</option>
                    <option value="coordinacion">Coordinación</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
                  <select
                    value={newTask.prioridad}
                    onChange={(e) => setNewTask({...newTask, prioridad: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({...newTask, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={newTask.titulo}
                  onChange={(e) => setNewTask({...newTask, titulo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título de la tarea"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={newTask.descripcion}
                  onChange={(e) => setNewTask({...newTask, descripcion: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción detallada de la tarea"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio (opcional)</label>
                  <input
                    type="datetime-local"
                    value={newTask.fecha_inicio}
                    onChange={(e) => setNewTask({...newTask, fecha_inicio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento (opcional)</label>
                  <input
                    type="datetime-local"
                    value={newTask.fecha_vencimiento}
                    onChange={(e) => setNewTask({...newTask, fecha_vencimiento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                onClick={handleCloseNewTaskForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Crear Tarea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Tarea */}
      {editingTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Editar Tarea</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Episodio del Paciente *</label>
                  <select
                    value={editingTask.paciente_episodio}
                    onChange={(e) => setEditingTask({...editingTask, paciente_episodio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar episodio</option>
                    {patients.map(patient => (
                      <option key={patient.episodio} value={patient.episodio}>
                        {patient.nombre} {patient.apellido_paterno} - {patient.rut} ({patient.episodio})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gestor *</label>
                  <select
                    value={editingTask.gestor}
                    onChange={(e) => setEditingTask({...editingTask, gestor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar gestor</option>
                    {gestoras.map(gestora => (
                      <option key={gestora.id} value={gestora.name}>
                        {gestora.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol (opcional)</label>
                  <input
                    type="text"
                    value={editingTask.rol || ''}
                    onChange={(e) => setEditingTask({...editingTask, rol: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Coordinadora"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={editingTask.tipo}
                    onChange={(e) => setEditingTask({...editingTask, tipo: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="general">General</option>
                    <option value="social">Social</option>
                    <option value="clinica">Clínica</option>
                    <option value="administrativa">Administrativa</option>
                    <option value="coordinacion">Coordinación</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
                  <select
                    value={editingTask.prioridad}
                    onChange={(e) => setEditingTask({...editingTask, prioridad: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({...editingTask, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={editingTask.titulo}
                  onChange={(e) => setEditingTask({...editingTask, titulo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título de la tarea"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={editingTask.descripcion || ''}
                  onChange={(e) => setEditingTask({...editingTask, descripcion: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción detallada de la tarea"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio (opcional)</label>
                  <input
                    type="datetime-local"
                    value={editingTask.fecha_inicio ? new Date(editingTask.fecha_inicio).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingTask({...editingTask, fecha_inicio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento (opcional)</label>
                  <input
                    type="datetime-local"
                    value={editingTask.fecha_vencimiento ? new Date(editingTask.fecha_vencimiento).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingTask({...editingTask, fecha_vencimiento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Gestora */}
      {showNewGestoraForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Crear Nueva Gestora</h3>
              <button
                onClick={handleCloseNewGestoraForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              {gestorasError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {gestorasError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Gestora *</label>
                <input
                  type="text"
                  value={newGestoraName}
                  onChange={(e) => setNewGestoraName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Gestora A"
                  required
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateGestora();
                    }
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">El nombre debe ser único</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                onClick={handleCloseNewGestoraForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGestora}
                disabled={gestorasLoading || !newGestoraName.trim()}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gestorasLoading ? 'Creando...' : 'Crear Gestora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};