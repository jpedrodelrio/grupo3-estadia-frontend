import React, { useMemo, useState } from 'react';
import { AlertTriangle, Clock, User, FileText, Plus } from 'lucide-react';
import { Patient, Task } from '../../types';
import { useGestoras } from '../../hooks/useGestoras';
import { NotificationModal, NotificationType } from '../UI/NotificationModal';

interface AlertsPanelProps {
  patients: Patient[];
  onCreateTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
}

interface Alert {
  id: string;
  type: 'estadia_prolongada' | 'riesgo_social' | 'riesgo_administrativo' | 'riesgo_clinico' | 'riesgo_global' | 'probabilidad_alta';
  patient: string;
  rut: string;
  service: string;
  message: string;
  level: 'rojo' | 'amarillo';
  time: string;
  timestamp: number; // Timestamp para ordenamiento
  patientId: string;
  probSobreEstadia: number | null; // Probabilidad de sobre-estadía
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ patients, onCreateTask }) => {
  const { gestoras } = useGestoras();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  
  // Estado para notificaciones
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });
  const [newTask, setNewTask] = useState<{
    paciente_episodio: string;
    gestor: string;
    rol: string;
    tipo: 'general' | 'social' | 'clinica' | 'administrativa' | 'coordinacion';
    prioridad: 'baja' | 'media' | 'alta' | 'critica';
    titulo: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_vencimiento: string;
    status: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  }>({
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
  // Función para obtener el servicio clínico basado en el paciente
  const getServicioClinico = (patient: Patient): string => {
    if (patient.convenio?.includes('CAEC')) return 'Medicina Interna';
    if (patient.convenio?.includes('GRD')) return 'Especialidades';
    if (patient.convenio?.includes('FONASA')) return 'Servicio General';
    if (patient.convenio?.includes('ISAPRE')) return 'Servicio Privado';
    if (patient.ultima_cama) {
      // Inferir servicio desde la cama (ej: UCI, UTI, etc.)
      const cama = patient.ultima_cama.toUpperCase();
      if (cama.includes('UCI') || cama.includes('UTI')) return 'UCI';
      if (cama.includes('CARDIO')) return 'Cardiología';
      if (cama.includes('CIRU')) return 'Cirugía';
    }
    return 'Servicio General';
  };

  // Función para calcular el tiempo transcurrido
  const calculateTimeAgo = (dateString: string): string => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) {
        return `${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      } else {
        return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      }
    } catch {
      return 'Fecha inválida';
    }
  };

  // Función para formatear el RUT
  const formatRut = (rut: string): string => {
    if (!rut) return '-';
    // Si ya está formateado, retornarlo
    if (rut.includes('.')) return rut;
    // Formatear RUT: 12345678-9 -> 12.345.678-9
    const cleanRut = rut.replace(/[^0-9kK-]/g, '');
    const parts = cleanRut.split('-');
    if (parts.length === 2) {
      const number = parts[0];
      const dv = parts[1];
      const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${formatted}-${dv}`;
    }
    return rut;
  };

  // Función para normalizar el nivel de riesgo
  const normalizeRisk = (risk: string | null | undefined): string => {
    if (!risk) return '';
    const riskLower = risk.toLowerCase().trim();
    if (riskLower === 'alto' || riskLower === 'rojo') return 'alto';
    if (riskLower === 'medio' || riskLower === 'amarillo') return 'medio';
    if (riskLower === 'bajo' || riskLower === 'verde') return 'bajo';
    return riskLower;
  };

  // Generar alertas basadas en los pacientes reales
  const alerts = useMemo(() => {
    const generatedAlerts: Alert[] = [];

    // Filtrar solo pacientes activos
    const activePatients = patients.filter(p => p.estado === 'activo' || p.estado === 'alta_pendiente');

    activePatients.forEach((patient) => {
      const fullName = `${patient.nombre} ${patient.apellido_paterno} ${patient.apellido_materno}`.trim();
      const service = getServicioClinico(patient);
      const rut = formatRut(patient.rut);
      const dateString = patient.updated_at || patient.created_at || patient.fecha_ingreso;
      const timeAgo = calculateTimeAgo(dateString);
      // Obtener timestamp para ordenamiento
      const timestamp = dateString ? new Date(dateString).getTime() : Date.now();

      // 1. Alerta: Estadía prolongada (> 15 días)
      if (patient.dias_hospitalizacion > 15) {
        generatedAlerts.push({
          id: `${patient.episodio}-estadia-prolongada`,
          type: 'estadia_prolongada',
          patient: fullName,
          rut: rut,
          service: service,
          message: `Estadía prolongada - ${patient.dias_hospitalizacion} días hospitalizados`,
          level: patient.dias_hospitalizacion > 20 ? 'rojo' : 'amarillo',
          time: timeAgo,
          timestamp: timestamp,
          patientId: patient.episodio,
          probSobreEstadia: patient.prob_sobre_estadia,
        });
      }

      // 2. Alerta: Alto riesgo social
      const riesgoSocial = normalizeRisk(patient.riesgo_social);
      if (riesgoSocial === 'alto' || riesgoSocial === 'rojo') {
        generatedAlerts.push({
          id: `${patient.episodio}-riesgo-social`,
          type: 'riesgo_social',
          patient: fullName,
          rut: rut,
          service: service,
          message: 'Alto riesgo social - Requiere evaluación urgente',
          level: 'rojo',
          time: timeAgo,
          timestamp: timestamp,
          patientId: patient.episodio,
          probSobreEstadia: patient.prob_sobre_estadia,
        });
      }

      // 3. Alerta: Alto riesgo clínico
      const riesgoClinico = normalizeRisk(patient.riesgo_clinico);
      if (riesgoClinico === 'alto' || riesgoClinico === 'rojo') {
        generatedAlerts.push({
          id: `${patient.episodio}-riesgo-clinico`,
          type: 'riesgo_clinico',
          patient: fullName,
          rut: rut,
          service: service,
          message: 'Complicaciones clínicas - Evaluación pendiente',
          level: 'rojo',
          time: timeAgo,
          timestamp: timestamp,
          patientId: patient.episodio,
          probSobreEstadia: patient.prob_sobre_estadia,
        });
      }

      // 4. Alerta: Alto riesgo administrativo
      const riesgoAdmin = normalizeRisk(patient.riesgo_administrativo);
      if (riesgoAdmin === 'alto' || riesgoAdmin === 'rojo') {
        generatedAlerts.push({
          id: `${patient.episodio}-riesgo-administrativo`,
          type: 'riesgo_administrativo',
          patient: fullName,
          rut: rut,
          service: service,
          message: 'Problemas de previsión - Verificar cobertura',
          level: 'rojo',
          time: timeAgo,
          timestamp: timestamp,
          patientId: patient.episodio,
          probSobreEstadia: patient.prob_sobre_estadia,
        });
      } else if (riesgoAdmin === 'medio' || riesgoAdmin === 'amarillo') {
        generatedAlerts.push({
          id: `${patient.episodio}-riesgo-administrativo`,
          type: 'riesgo_administrativo',
          patient: fullName,
          rut: rut,
          service: service,
          message: 'Problemas de previsión - Verificar cobertura',
          level: 'amarillo',
          time: timeAgo,
          timestamp: timestamp,
          patientId: patient.episodio,
          probSobreEstadia: patient.prob_sobre_estadia,
        });
      }

      // 5. Alerta: Alto riesgo global
      const riesgoGlobal = normalizeRisk(patient.nivel_riesgo_global);
      if (riesgoGlobal === 'alto' || riesgoGlobal === 'rojo') {
        generatedAlerts.push({
          id: `${patient.episodio}-riesgo-global`,
          type: 'riesgo_global',
          patient: fullName,
          rut: rut,
          service: service,
          message: 'Alto riesgo global - Requiere atención prioritaria',
          level: 'rojo',
          time: timeAgo,
          timestamp: timestamp,
          patientId: patient.episodio,
          probSobreEstadia: patient.prob_sobre_estadia,
        });
      }

      // 6. Alerta: Alta probabilidad de sobre-estadía (>= 0.7)
      if (patient.prob_sobre_estadia !== null && patient.prob_sobre_estadia !== undefined && patient.prob_sobre_estadia >= 0.7) {
        generatedAlerts.push({
          id: `${patient.episodio}-probabilidad-alta`,
          type: 'probabilidad_alta',
          patient: fullName,
          rut: rut,
          service: service,
          message: `Alta probabilidad de sobre-estadía - ${(patient.prob_sobre_estadia * 100).toFixed(1)}%`,
          level: 'rojo',
          time: timeAgo,
          timestamp: timestamp,
          patientId: patient.episodio,
          probSobreEstadia: patient.prob_sobre_estadia,
        });
      }
    });

    // Ordenar alertas por prioridad (rojo primero) y luego por tiempo (más recientes primero)
    return generatedAlerts.sort((a, b) => {
      // Primero ordenar por nivel de prioridad (rojo primero)
      if (a.level !== b.level) {
        return a.level === 'rojo' ? -1 : 1;
      }
      // Si tienen el mismo nivel, ordenar por timestamp (más recientes primero)
      return b.timestamp - a.timestamp;
    }).slice(0, 20); // Limitar a las 20 alertas más importantes
  }, [patients]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'estadia_prolongada': return Clock;
      case 'riesgo_social': return User;
      case 'riesgo_administrativo': return FileText;
      case 'riesgo_clinico': return AlertTriangle;
      case 'riesgo_global': return AlertTriangle;
      case 'probabilidad_alta': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'rojo': return 'bg-red-50 border-red-200';
      case 'amarillo': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getAlertTextColor = (level: string) => {
    switch (level) {
      case 'rojo': return 'text-red-800';
      case 'amarillo': return 'text-yellow-800';
      default: return 'text-gray-800';
    }
  };

  const getAlertIconColor = (level: string) => {
    switch (level) {
      case 'rojo': return 'text-red-600';
      case 'amarillo': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Función para obtener el color de la probabilidad de sobre-estadía
  const getProbabilidadColor = (prob: number | null): string => {
    if (prob === null || prob === undefined) return '';
    if (prob >= 0.7) return 'bg-red-100 text-red-700 border-red-300';
    if (prob >= 0.4) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  // Función para abrir el modal de creación de tarea desde una alerta
  const handleCreateTaskFromAlert = (alert: Alert) => {
    // Buscar el paciente correspondiente a la alerta
    const patient = patients.find(p => p.episodio === alert.patientId);
    if (!patient) return;

    // Determinar el tipo de tarea según el tipo de alerta
    let taskType: 'general' | 'social' | 'clinica' | 'administrativa' | 'coordinacion' = 'general';
    let taskTitle = '';
    let taskDescription = '';
    let taskPriority: 'baja' | 'media' | 'alta' | 'critica' = alert.level === 'rojo' ? 'alta' : 'media';

    switch (alert.type) {
      case 'riesgo_social':
        taskType = 'social';
        taskTitle = `Seguimiento - Riesgo Social: ${alert.patient}`;
        taskDescription = `Alerta de riesgo social detectada para el paciente ${alert.patient} (RUT: ${alert.rut}). ${alert.message}`;
        break;
      case 'riesgo_clinico':
        taskType = 'clinica';
        taskTitle = `Seguimiento - Riesgo Clínico: ${alert.patient}`;
        taskDescription = `Alerta de riesgo clínico detectada para el paciente ${alert.patient} (RUT: ${alert.rut}). ${alert.message}`;
        break;
      case 'riesgo_administrativo':
        taskType = 'administrativa';
        taskTitle = `Seguimiento - Riesgo Administrativo: ${alert.patient}`;
        taskDescription = `Alerta de riesgo administrativo detectada para el paciente ${alert.patient} (RUT: ${alert.rut}). ${alert.message}`;
        break;
      case 'estadia_prolongada':
        taskType = 'clinica';
        taskTitle = `Seguimiento - Estadía Prolongada: ${alert.patient}`;
        taskDescription = `Alerta de estadía prolongada para el paciente ${alert.patient} (RUT: ${alert.rut}). ${alert.message}`;
        break;
      case 'riesgo_global':
        taskType = 'general';
        taskTitle = `Seguimiento - Alto Riesgo Global: ${alert.patient}`;
        taskDescription = `Alerta de alto riesgo global para el paciente ${alert.patient} (RUT: ${alert.rut}). ${alert.message}`;
        taskPriority = 'alta';
        break;
      case 'probabilidad_alta':
        taskType = 'clinica';
        taskTitle = `Seguimiento - Alta Probabilidad Sobre-Estadía: ${alert.patient}`;
        taskDescription = `Alerta de alta probabilidad de sobre-estadía para el paciente ${alert.patient} (RUT: ${alert.rut}). ${alert.message}`;
        taskPriority = 'alta';
        break;
    }

    // Agregar información de probabilidad si está disponible
    if (alert.probSobreEstadia !== null && alert.probSobreEstadia !== undefined) {
      taskDescription += `\n\nProbabilidad de sobre-estadía: ${(alert.probSobreEstadia * 100).toFixed(1)}%`;
    }

    // Prellenar el formulario
    setNewTask({
      paciente_episodio: alert.patientId,
      gestor: '',
      rol: '',
      tipo: taskType,
      prioridad: taskPriority,
      titulo: taskTitle,
      descripcion: taskDescription,
      fecha_inicio: '',
      fecha_vencimiento: '',
      status: 'pendiente',
    });

    setSelectedAlert(alert);
    setShowTaskModal(true);
  };

  // Función para cerrar el modal
  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedAlert(null);
    setNewTask({
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
  };

  // Función para crear la tarea
  const handleCreateTask = async () => {
    if (!newTask.titulo || !newTask.paciente_episodio || !newTask.gestor) return;
    
    setCreatingTask(true);
    try {
      const createdTask = await onCreateTask({
        ...newTask,
      });
      
      if (createdTask) {
        handleCloseTaskModal();
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Tarea creada exitosamente',
          message: `La tarea "${newTask.titulo}" ha sido creada correctamente.`,
        });
      } else {
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Error al crear tarea',
          message: 'No se pudo crear la tarea. Por favor, intenta nuevamente.',
        });
      }
    } catch (error) {
      console.error('Error al crear tarea:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error al crear tarea',
        message: error instanceof Error ? error.message : 'Ocurrió un error inesperado al crear la tarea.',
      });
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Alertas Tempranas</h2>
        <p className="mt-1 text-sm text-gray-600">
          Notificaciones de riesgo y seguimiento prioritario
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          
          return (
            <div
              key={alert.id}
              className={`p-4 border-l-4 ${getAlertColor(alert.level)} border-b border-gray-100 last:border-b-0 hover:bg-opacity-80 transition-colors cursor-pointer`}
              title={`Episodio: ${alert.patientId}`}
            >
              <div className="flex items-start">
                <div className={`flex-shrink-0 p-2 rounded-lg bg-white shadow-sm mr-3`}>
                  <Icon className={`h-5 w-5 ${getAlertIconColor(alert.level)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-medium ${getAlertTextColor(alert.level)}`}>
                      {alert.patient}
                    </p>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">hace {alert.time}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateTaskFromAlert(alert);
                        }}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded border-2 bg-transparent hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          alert.level === 'rojo' 
                            ? 'border-red-800 text-red-800 hover:bg-red-800 focus:ring-red-800' 
                            : alert.level === 'amarillo'
                            ? 'border-yellow-800 text-yellow-800 hover:bg-yellow-800 focus:ring-yellow-800'
                            : 'border-gray-800 text-gray-800 hover:bg-gray-800 focus:ring-gray-800'
                        }`}
                        title="Crear tarea desde esta alerta"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {alert.rut} • {alert.service}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm ${getAlertTextColor(alert.level)}`}>
                      {alert.message}
                    </p>
                    {alert.probSobreEstadia !== null && alert.probSobreEstadia !== undefined && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getProbabilidadColor(alert.probSobreEstadia)}`}>
                        Prob. Sobre-Estadía: {(alert.probSobreEstadia * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay alertas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {patients.length === 0 
              ? 'No hay pacientes cargados.' 
              : 'Todas las gestiones están al día.'}
          </p>
        </div>
      )}

      {/* Modal de Creación de Tarea */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Nueva Tarea desde Alerta</h3>
              <button
                onClick={handleCloseTaskModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              {selectedAlert && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Paciente:</strong> {selectedAlert.patient} ({selectedAlert.rut}) | 
                    <strong> Episodio:</strong> {selectedAlert.patientId} | 
                    <strong> Servicio:</strong> {selectedAlert.service}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Episodio del Paciente *</label>
                  <input
                    type="text"
                    value={newTask.paciente_episodio}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
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
                  rows={4}
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
                onClick={handleCloseTaskModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTask}
                disabled={creatingTask || !newTask.titulo || !newTask.paciente_episodio || !newTask.gestor}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingTask ? 'Creando...' : 'Crear Tarea'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notificación */}
      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
    </div>
  );
};