import React from 'react';
import { Clock, Users, AlertTriangle, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { Patient, Task } from '../../types';

interface OperationalDashboardProps {
  patients: Patient[];
  tasks: Task[];
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ patients, tasks }) => {
  const activePatients = patients.filter(p => p.estado === 'activo');
  const pendingTasks = tasks.filter(t => t.estado === 'pendiente');
  const overdueTasks = tasks.filter(t => {
    const dueDate = new Date(t.fecha_vencimiento);
    return t.estado === 'pendiente' && dueDate < new Date();
  });
  const completedToday = tasks.filter(t => {
    const today = new Date().toDateString();
    const completedDate = new Date(t.updated_at).toDateString();
    return t.estado === 'completada' && completedDate === today;
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
      subtitle: 'Gestiones finalizadas'
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tareas Críticas</h3>
          <div className="space-y-3">
            {overdueTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{task.titulo}</p>
                  <p className="text-xs text-red-600">
                    Vencida: {new Date(task.fecha_vencimiento).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
            ))}
            
            {pendingTasks.filter(t => !overdueTasks.includes(t)).slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">{task.titulo}</p>
                  <p className="text-xs text-yellow-600">
                    Vence: {new Date(task.fecha_vencimiento).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            ))}
            
            {pendingTasks.length === 0 && overdueTasks.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm text-gray-500">Todas las tareas están al día</p>
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