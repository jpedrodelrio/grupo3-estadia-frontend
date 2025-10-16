import React, { useState } from 'react';
import { Plus, Clock, User, AlertTriangle, CheckCircle, Filter } from 'lucide-react';
import { Task, Patient } from '../../types';

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
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [newTask, setNewTask] = useState({
    patient_id: '',
    assigned_to: '',
    assigned_role: 'gestor_estadia',
    tipo_tarea: 'general' as const,
    titulo: '',
    descripcion: '',
    prioridad: 'media' as const,
    fecha_vencimiento: '',
  });

  const filteredTasks = tasks.filter(task => {
    if (filterStatus && task.estado !== filterStatus) return false;
    if (filterRole && task.assigned_role !== filterRole) return false;
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

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completada': return 'bg-green-100 text-green-800';
      case 'en_progreso': return 'bg-blue-100 text-blue-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateTask = () => {
    if (!newTask.titulo || !newTask.patient_id || !newTask.assigned_to) return;
    
    onCreateTask({
      ...newTask,
      estado: 'pendiente',
    });
    
    setNewTask({
      patient_id: '',
      assigned_to: '',
      assigned_role: 'gestor_estadia',
      tipo_tarea: 'general',
      titulo: '',
      descripcion: '',
      prioridad: 'media',
      fecha_vencimiento: '',
    });
    setShowNewTaskForm(false);
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.nombre} ${patient.apellido_paterno}` : 'Paciente no encontrado';
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros y botón nueva tarea */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h2>
          <p className="text-sm text-gray-600">Coordinación entre equipos clínicos y administrativos</p>
        </div>
        <button
          onClick={() => setShowNewTaskForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
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
            const isOverdue = new Date(task.fecha_vencimiento) < new Date() && task.estado === 'pendiente';
            
            return (
              <div key={task.id} className={`p-6 hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{task.titulo}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.prioridad)}`}>
                        {task.prioridad.charAt(0).toUpperCase() + task.prioridad.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.estado)}`}>
                        {task.estado.replace('_', ' ').charAt(0).toUpperCase() + task.estado.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{task.descripcion}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>Paciente: {getPatientName(task.patient_id)}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>Asignado a: {task.assigned_to} ({task.assigned_role.replace('_', ' ')})</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          Vence: {new Date(task.fecha_vencimiento).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isOverdue && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    {task.estado === 'pendiente' && (
                      <button
                        onClick={() => onUpdateTask(task.id, { estado: 'en_progreso' })}
                        className="px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Iniciar
                      </button>
                    )}
                    {task.estado === 'en_progreso' && (
                      <button
                        onClick={() => onUpdateTask(task.id, { estado: 'completada' })}
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
                {filterStatus || filterRole ? 'No hay tareas que coincidan con los filtros.' : 'Comience creando una nueva tarea.'}
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
                onClick={() => setShowNewTaskForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                  <select
                    value={newTask.patient_id}
                    onChange={(e) => setNewTask({...newTask, patient_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar paciente</option>
                    {patients.filter(p => p.estado === 'activo').map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.nombre} {patient.apellido_paterno} - {patient.rut}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
                  <input
                    type="text"
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del responsable"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={newTask.assigned_role}
                    onChange={(e) => setNewTask({...newTask, assigned_role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gestor_estadia">Gestor de Estadía</option>
                    <option value="trabajador_social">Trabajador Social</option>
                    <option value="analista">Analista</option>
                    <option value="jefe_servicio">Jefe de Servicio</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={newTask.tipo_tarea}
                    onChange={(e) => setNewTask({...newTask, tipo_tarea: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="social">Social</option>
                    <option value="clinica">Clínica</option>
                    <option value="administrativa">Administrativa</option>
                    <option value="coordinacion">Coordinación</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={newTask.prioridad}
                    onChange={(e) => setNewTask({...newTask, prioridad: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={newTask.descripcion}
                  onChange={(e) => setNewTask({...newTask, descripcion: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción detallada de la tarea"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={newTask.fecha_vencimiento}
                  onChange={(e) => setNewTask({...newTask, fecha_vencimiento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                onClick={() => setShowNewTaskForm(false)}
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
    </div>
  );
};