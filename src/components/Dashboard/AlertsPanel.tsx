import React from 'react';
import { AlertTriangle, Clock, User, FileText } from 'lucide-react';

export const AlertsPanel: React.FC = () => {
  const alerts = [
    {
      id: 1,
      type: 'estadia_prolongada',
      patient: 'María González',
      rut: '12.345.678-9',
      service: 'Medicina Interna',
      message: 'Estadía prolongada - 15 días hospitalizados',
      level: 'rojo' as const,
      time: '2 horas',
    },
    {
      id: 2,
      type: 'riesgo_social',
      patient: 'Pedro Martínez',
      rut: '98.765.432-1',
      service: 'Cardiología',
      message: 'Alto riesgo social - Requiere evaluación urgente',
      level: 'rojo' as const,
      time: '4 horas',
    },
    {
      id: 3,
      type: 'riesgo_administrativo',
      patient: 'Ana López',
      rut: '15.678.234-5',
      service: 'Cirugía',
      message: 'Problemas de previsión - Verificar cobertura',
      level: 'amarillo' as const,
      time: '6 horas',
    },
    {
      id: 4,
      type: 'riesgo_clinico',
      patient: 'Carlos Ramírez',
      rut: '87.654.321-9',
      service: 'UCI',
      message: 'Complicaciones clínicas - Evaluación pendiente',
      level: 'rojo' as const,
      time: '1 hora',
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'estadia_prolongada': return Clock;
      case 'riesgo_social': return User;
      case 'riesgo_administrativo': return FileText;
      case 'riesgo_clinico': return AlertTriangle;
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
                    <span className="text-xs text-gray-500">hace {alert.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {alert.rut} • {alert.service}
                  </p>
                  <p className={`text-sm ${getAlertTextColor(alert.level)}`}>
                    {alert.message}
                  </p>
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
            Todas las gestiones están al día.
          </p>
        </div>
      )}
    </div>
  );
};