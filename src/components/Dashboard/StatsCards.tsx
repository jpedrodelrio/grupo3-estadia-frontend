import React from 'react';
import { Users, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Patient } from '../../types';

interface StatsCardsProps {
  patients: Patient[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ patients }) => {
  const activePatients = patients.filter(p => p.estado === 'activo').length;
  const avgStayDays = Math.round(
    activePatients > 0 
      ? patients.filter(p => p.estado === 'activo')
          .reduce((sum, p) => sum + p.dias_hospitalizacion, 0) / activePatients 
      : 0
  );
  const highRiskPatients = patients.filter(p => p.nivel_riesgo_global === 'rojo').length;
  const pendingDischarge = patients.filter(p => p.estado === 'alta_pendiente').length;

  const stats = [
    {
      title: 'Pacientes Activos',
      value: activePatients.toString(),
      icon: Users,
      color: 'blue',
      change: '+2.5%'
    },
    {
      title: 'Estadía Promedio',
      value: `${avgStayDays} días`,
      icon: Clock,
      color: 'green',
      change: '-0.8%'
    },
    {
      title: 'Alto Riesgo',
      value: highRiskPatients.toString(),
      icon: AlertTriangle,
      color: 'red',
      change: '+1.2%'
    },
    {
      title: 'Altas Pendientes',
      value: pendingDischarge.toString(),
      icon: TrendingUp,
      color: 'orange',
      change: '+5.4%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-100' :
                stat.color === 'green' ? 'bg-green-100' :
                stat.color === 'red' ? 'bg-red-100' :
                'bg-orange-100'
              }`}>
                <Icon className={`h-6 w-6 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'red' ? 'text-red-600' :
                  'text-orange-600'
                }`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <span className={`ml-2 text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};