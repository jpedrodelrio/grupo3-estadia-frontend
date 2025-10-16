import React from 'react';
import { Eye, Calendar, AlertCircle, User } from 'lucide-react';
import { Patient } from '../../types';

interface PatientTableProps {
  patients: Patient[];
  onViewPatient: (patient: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({ patients, onViewPatient }) => {
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'verde': return 'bg-green-100 text-green-800';
      case 'amarillo': return 'bg-yellow-100 text-yellow-800';
      case 'rojo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'activo': return 'bg-blue-100 text-blue-800';
      case 'alta_pendiente': return 'bg-orange-100 text-orange-800';
      case 'dado_alta': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getDaysUntilDischarge = (estimatedDischarge: string) => {
    const today = new Date();
    const discharge = new Date(estimatedDischarge);
    const diffTime = discharge.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Pacientes Hospitalizados</h2>
        <p className="mt-1 text-sm text-gray-600">
          Lista completa de pacientes con seguimiento de estadía
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Servicio Clínico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Días Hospitalizado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alta Estimada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Riesgo Global
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.map((patient) => {
              const daysToDischarge = getDaysUntilDischarge(patient.fecha_estimada_alta);
              
              return (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.nombre} {patient.apellido_paterno}
                        </div>
                        <div className="text-sm text-gray-500">
                          RUT: {patient.rut} • {patient.edad} años
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.servicio_clinico}</div>
                    <div className="text-sm text-gray-500">{patient.prevision}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {patient.dias_hospitalizacion} días
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(patient.fecha_estimada_alta)}
                    </div>
                    <div className={`text-sm ${daysToDischarge < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {daysToDischarge < 0 ? `${Math.abs(daysToDischarge)} días atrasado` : 
                       daysToDischarge === 0 ? 'Hoy' : 
                       `En ${daysToDischarge} días`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeColor(patient.nivel_riesgo_global)}`}>
                      {patient.nivel_riesgo_global === 'rojo' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {patient.nivel_riesgo_global.charAt(0).toUpperCase() + patient.nivel_riesgo_global.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(patient.estado)}`}>
                      {patient.estado.replace('_', ' ').charAt(0).toUpperCase() + patient.estado.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onViewPatient(patient)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {patients.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pacientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comience agregando pacientes al sistema.
          </p>
        </div>
      )}
    </div>
  );
};