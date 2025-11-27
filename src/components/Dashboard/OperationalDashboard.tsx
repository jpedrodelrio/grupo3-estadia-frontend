import React from 'react';
import { Clock, Users, AlertTriangle, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { Patient, Task } from '../../types';

interface OperationalDashboardProps {
  patients: Patient[];
  tasks: Task[];
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ patients, tasks }) => {

  const activePatients = patients.filter(p => p.estado === 'activo');
  const pendingTasks = tasks.filter(t => t.status === 'pendiente' || t.status === 'en_progreso');
  
  // Tareas vencidas: tienen fecha_vencimiento y están vencidas
  const overdueTasks = tasks.filter(t => {
    if (!t.fecha_vencimiento || t.status === 'completada' || t.status === 'cancelada') {
      return false;
    }
    const dueDate = new Date(t.fecha_vencimiento);
    return dueDate < new Date();
  });
  
  // Tareas críticas: prioridad crítica o alta, o vencidas
  const criticalTasks = tasks
    .filter(t => {
      // Incluir tareas con prioridad crítica o alta
      if (t.prioridad === 'critica' || t.prioridad === 'alta') {
        return t.status !== 'completada' && t.status !== 'cancelada';
      }
      // Incluir tareas vencidas
      if (t.fecha_vencimiento) {
        const dueDate = new Date(t.fecha_vencimiento);
        if (dueDate < new Date() && t.status !== 'completada' && t.status !== 'cancelada') {
          return true;
        }
      }
      return false;
    })
    .sort((a, b) => {
      // Ordenar por: 1) Prioridad crítica primero, 2) Vencidas, 3) Prioridad alta
      const priorityOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
      const aPriority = priorityOrder[a.prioridad] ?? 3;
      const bPriority = priorityOrder[b.prioridad] ?? 3;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Si tienen la misma prioridad, ordenar por fecha de vencimiento (más cercanas primero)
      if (a.fecha_vencimiento && b.fecha_vencimiento) {
        return new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime();
      }
      if (a.fecha_vencimiento) return -1;
      if (b.fecha_vencimiento) return 1;
      return 0;
    });
  
  // Tareas completadas hoy: verificar que tengan status completada y updated_at de hoy
  const completedToday = tasks.filter(t => {
    // Verificar que la tarea esté completada
    if (t.status !== 'completada') {
      return false;
    }
    
    // Verificar que tenga updated_at
    if (!t.updated_at) {
      return false;
    }
    
    try {
      const today = new Date().toDateString();
      const completedDate = new Date(t.updated_at).toDateString();
      const isToday = completedDate === today;
      return isToday;
    } catch (error) {
      console.warn('Error al procesar fecha de tarea:', t.id, error);
      return false;
    }
  });

  const avgStayDays = Math.round(
    activePatients.length > 0 
      ? activePatients.reduce((sum, p) => sum + p.dias_hospitalizacion, 0) / activePatients.length 
      : 0
  );

  const prolongedStayPatients = activePatients.filter(p => p.dias_hospitalizacion > 10).length;

  const operationalMetrics = [
    {
      title: 'Pacientes Activos',
      value: activePatients.length,
      icon: Users,
      color: 'blue',
      subtitle: `${patients.filter(p => p.estado === 'alta_pendiente').length} con alta pendiente`
    },
    {
      title: 'Tareas Pendientes',
      value: pendingTasks.length,
      icon: Clock,
      color: 'orange',
      subtitle: `${overdueTasks.length} vencidas`
    },
    {
      title: 'Estadía Promedio',
      value: `${avgStayDays} días`,
      icon: Calendar,
      color: 'green',
      subtitle: `${prolongedStayPatients} estadías prolongadas`
    },
    {
      title: 'Completadas Hoy',
      value: completedToday.length,
      icon: CheckCircle,
      color: 'purple',
      subtitle: 'Gestiones/tareas finalizadas'
    }
  ];

  const riskDistribution = {
    rojo: patients.filter(p => p.nivel_riesgo_global === 'rojo').length,
    amarillo: patients.filter(p => p.nivel_riesgo_global === 'amarillo').length,
    verde: patients.filter(p => p.nivel_riesgo_global === 'verde').length,
  };

  return (
    <div className="space-y-6">
      {/* Métricas Operacionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {operationalMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${
                  metric.color === 'blue' ? 'bg-blue-100' :
                  metric.color === 'orange' ? 'bg-orange-100' :
                  metric.color === 'green' ? 'bg-green-100' :
                  'bg-purple-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    metric.color === 'blue' ? 'text-blue-600' :
                    metric.color === 'orange' ? 'text-orange-600' :
                    metric.color === 'green' ? 'text-green-600' :
                    'text-purple-600'
                  }`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard de Riesgos y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Riesgos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Riesgos</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Alto Riesgo (Rojo)</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 mr-2">{riskDistribution.rojo}</span>
                <span className="text-sm text-gray-500">pacientes</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Riesgo Medio (Amarillo)</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 mr-2">{riskDistribution.amarillo}</span>
                <span className="text-sm text-gray-500">pacientes</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Bajo Riesgo (Verde)</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 mr-2">{riskDistribution.verde}</span>
                <span className="text-sm text-gray-500">pacientes</span>
              </div>
            </div>
          </div>
          
          {/* Barra de progreso visual */}
          <div className="mt-4">
            {patients.length > 0 && (
              <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500" 
                  style={{ width: `${(riskDistribution.rojo / patients.length) * 100}%` }}
                ></div>
                <div 
                  className="bg-yellow-500" 
                  style={{ width: `${(riskDistribution.amarillo / patients.length) * 100}%` }}
                ></div>
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(riskDistribution.verde / patients.length) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Tareas Críticas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tareas Críticas ({criticalTasks.length})
          </h3>
          <div className="space-y-3">
            {criticalTasks.slice(0, 8).map((task) => {
              const isOverdue = task.fecha_vencimiento && new Date(task.fecha_vencimiento) < new Date();
              const isCritical = task.prioridad === 'critica';
              const isHigh = task.prioridad === 'alta';
              
              // Determinar el estilo según la urgencia
              const bgColor = isOverdue || isCritical 
                ? 'bg-red-50 border-red-200' 
                : isHigh 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-yellow-50 border-yellow-200';
              
              const textColor = isOverdue || isCritical 
                ? 'text-red-800' 
                : isHigh 
                ? 'text-orange-800' 
                : 'text-yellow-800';
              
              const subtitleColor = isOverdue || isCritical 
                ? 'text-red-600' 
                : isHigh 
                ? 'text-orange-600' 
                : 'text-yellow-600';
              
              const iconColor = isOverdue || isCritical 
                ? 'text-red-600' 
                : isHigh 
                ? 'text-orange-600' 
                : 'text-yellow-600';
              
              return (
                <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${bgColor}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-medium ${textColor}`}>{task.titulo}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${isCritical ? 'bg-red-200 text-red-800' : isHigh ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'}`}>
                        {task.prioridad.charAt(0).toUpperCase() + task.prioridad.slice(1)}
                      </span>
                    </div>
                    <p className={`text-xs ${subtitleColor}`}>
                      {isOverdue 
                        ? `Vencida: ${new Date(task.fecha_vencimiento!).toLocaleDateString('es-CL')}`
                        : task.fecha_vencimiento 
                        ? `Vence: ${new Date(task.fecha_vencimiento).toLocaleDateString('es-CL')}`
                        : task.status === 'en_progreso'
                        ? 'En progreso'
                        : 'Pendiente'}
                    </p>
                    {task.gestor && (
                      <p className="text-xs text-gray-500 mt-1">Gestor: {task.gestor}</p>
                    )}
                  </div>
                  <div className="flex items-center">
                    {isOverdue || isCritical ? (
                      <AlertTriangle className={`h-4 w-4 ${iconColor}`} />
                    ) : (
                      <Clock className={`h-4 w-4 ${iconColor}`} />
                    )}
                  </div>
                </div>
              );
            })}
            
            {criticalTasks.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm text-gray-500">No hay tareas críticas</p>
                <p className="text-xs text-gray-400 mt-1">Todas las tareas están bajo control</p>
              </div>
            )}
            
            {criticalTasks.length > 8 && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  Mostrando 8 de {criticalTasks.length} tareas críticas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicadores de Rendimiento */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicadores de Rendimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(completedToday.length + pendingTasks.length) > 0 
                ? Math.round((completedToday.length / (completedToday.length + pendingTasks.length)) * 100)
                : 0}%
            </p>
            <p className="text-sm text-gray-600">Eficiencia Diaria</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {patients.length > 0 
                ? Math.round((riskDistribution.rojo / patients.length) * 100)
                : 0}%
            </p>
            <p className="text-sm text-gray-600">Pacientes Alto Riesgo</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{avgStayDays}</p>
            <p className="text-sm text-gray-600">Días Promedio Estadía</p>
          </div>
        </div>
      </div>
    </div>
  );
};