import React from 'react';
import { Eye, Calendar, AlertCircle, User, RefreshCw, Database } from 'lucide-react';
import { Patient } from '../../types';
import { usePatientsAPI, useServerHealth } from '../../hooks/usePatientsAPI';

interface PatientTableProps {
  patients?: Patient[]; // Hacer opcional para usar datos de API
  onViewPatient: (patient: Patient) => void;
  useAPIData?: boolean; // Nueva prop para usar datos de API
  filters?: {
    search?: string;
    service?: string;
    risk?: string;
    status?: string;
    age_min?: number;
    age_max?: number;
  };
}

export const PatientTable: React.FC<PatientTableProps> = ({ 
  patients: propPatients, 
  onViewPatient, 
  useAPIData = false,
  filters = {}
}) => {
  // Hook para datos de API
  const { 
    patients: apiPatients, 
    loading: apiLoading, 
    error: apiError, 
    total,
    currentPage,
    totalPages,
    fetchPatients,
    reloadData
  } = usePatientsAPI();

  // Hook para salud del servidor
  const { isHealthy, healthData, checkHealth } = useServerHealth();

  // Determinar qué datos usar
  const patients = useAPIData ? apiPatients : (propPatients || []);
  const loading = useAPIData ? apiLoading : false;
  const error = useAPIData ? apiError : null;

  // Cargar datos de API cuando cambien los filtros
  React.useEffect(() => {
    if (useAPIData) {
      fetchPatients({
        page: 1,
        limit: 50,
        ...filters
      });
    }
  }, [useAPIData, filters, fetchPatients]);

  const handleReloadData = async () => {
    if (useAPIData) {
      try {
        await reloadData();
      } catch (error) {
        console.error('Error reloading data:', error);
      }
    }
  };
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

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pacientes Hospitalizados</h2>
          <p className="mt-1 text-sm text-gray-600">Cargando datos...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando pacientes...</span>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pacientes Hospitalizados</h2>
          <p className="mt-1 text-sm text-red-600">Error cargando datos</p>
        </div>
        <div className="px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error de conexión</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          {useAPIData && (
            <button
              onClick={handleReloadData}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pacientes Hospitalizados</h2>
            <p className="mt-1 text-sm text-gray-600">
              {useAPIData ? (
                <>
                  Lista completa de pacientes CMBD con seguimiento de estadía
                  {total > 0 && (
                    <span className="ml-2 text-blue-600">
                      ({total.toLocaleString()} pacientes)
                    </span>
                  )}
                </>
              ) : (
                'Lista completa de pacientes con seguimiento de estadía'
              )}
            </p>
          </div>
          
          {useAPIData && (
            <div className="flex items-center space-x-3">
              {/* Estado del servidor */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isHealthy === true ? 'bg-green-400' : 
                  isHealthy === false ? 'bg-red-400' : 'bg-yellow-400'
                }`}></div>
                <span className="text-xs text-gray-500">
                  {isHealthy === true ? 'Servidor conectado' : 
                   isHealthy === false ? 'Servidor desconectado' : 'Verificando...'}
                </span>
              </div>
              
              {/* Botón de recarga */}
              <button
                onClick={handleReloadData}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Recargar datos del CSV"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Recargar
              </button>
              
              {/* Información de datos */}
              {healthData && (
                <div className="flex items-center text-xs text-gray-500">
                  <Database className="h-3 w-3 mr-1" />
                  {healthData.patientsLoaded?.toLocaleString()} registros
                </div>
              )}
            </div>
          )}
        </div>
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
                          {patient.nombre} {patient.apellido_paterno || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          RUT: {patient.rut} • {patient.edad} años
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.servicio || patient.servicio_clinico}</div>
                    <div className="text-sm text-gray-500">{patient.prevision}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {patient.estancia || patient.dias_hospitalizacion || 0} días
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeColor(patient.riesgo || patient.nivel_riesgo_global)}`}>
                      {(patient.riesgo || patient.nivel_riesgo_global) === 'rojo' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {(patient.riesgo || patient.nivel_riesgo_global) ? (patient.riesgo || patient.nivel_riesgo_global).charAt(0).toUpperCase() + (patient.riesgo || patient.nivel_riesgo_global).slice(1) : 'Sin riesgo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(patient.estado)}`}>
                      {patient.estado ? patient.estado.replace('_', ' ').charAt(0).toUpperCase() + patient.estado.replace('_', ' ').slice(1) : 'Sin estado'}
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