import React, { useState, useMemo } from 'react';
import { Eye, Calendar, AlertCircle, User, RefreshCw, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { Patient } from '../../types';

interface PatientTableProps {
  patients: Patient[];
  onViewPatient: (patient: Patient) => void;
  loading?: boolean;
}

const PATIENTS_PER_PAGE = 50;

export const PatientTable: React.FC<PatientTableProps> = ({ 
  patients, 
  onViewPatient,
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular paginación local
  const totalPages = Math.ceil(patients.length / PATIENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PATIENTS_PER_PAGE;
  const endIndex = startIndex + PATIENTS_PER_PAGE;
  const paginatedPatients = useMemo(() => {
    return patients.slice(startIndex, endIndex);
  }, [patients, startIndex, endIndex]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getCurrentRange = () => {
    const start = startIndex + 1;
    const end = Math.min(endIndex, patients.length);
    return `${start}-${end} de ${patients.length}`;
  };
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'verde': return 'bg-green-100 text-green-800';
      case 'amarillo': return 'bg-yellow-100 text-yellow-800';
      case 'rojo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLabel = (risk: string): string => {
    switch (risk) {
      case 'rojo': return 'Alto';
      case 'amarillo': return 'Medio';
      case 'verde': return 'Bajo';
      default: return risk.charAt(0).toUpperCase() + risk.slice(1);
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
    if (!dateString) return '-';
    
    // Si la fecha viene en formato 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss', extraer solo la parte de fecha
    const fechaParte = dateString.split('T')[0];
    
    // Verificar si está en formato 'YYYY-MM-DD'
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaParte)) {
      // Convertir de 'YYYY-MM-DD' a 'DD-MM-YYYY' (formato chileno)
      const [year, month, day] = fechaParte.split('-');
      return `${day}-${month}-${year}`;
    }
    
    // Si no está en el formato esperado, intentar parsear como Date
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Devolver original si no se puede parsear
      }
      return date.toLocaleDateString('es-CL');
    } catch {
      return dateString; // Devolver original si hay error
    }
  };

  const getDaysUntilDischarge = (estimatedDischarge: string) => {
    const today = new Date();
    const discharge = new Date(estimatedDischarge);
    const diffTime = discharge.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRefresh = () => {
    console.log('Todos los datos ya están cargados en memoria');
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pacientes Hospitalizados</h2>
            <p className="mt-1 text-sm text-gray-600">
              Lista completa de pacientes con seguimiento de estadía
            </p>
            {patients.length > 0 && (
              <div className="mt-2 flex items-center text-sm text-blue-600">
                <Database className="h-4 w-4 mr-1" />
                <span>{patients.length} pacientes totales</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
        
        {/* Controles de paginación local */}
        {patients.length > PATIENTS_PER_PAGE && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span>Mostrando {getCurrentRange()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Episodio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha de Admisión
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Días Hospitalizado
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Convenio-Isapre
              </th> */}
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
            {paginatedPatients.map((patient) => {
              const daysToDischarge = getDaysUntilDischarge(patient.fecha_estimada_alta);
              
              return (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 font-mono">
                      {patient.episodio}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID del episodio
                    </div>
                  </td>
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
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(patient.fecha_ingreso)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Ingreso al hospital
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {patient.dias_hospitalizacion} días
                      </span>
                    </div>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.convenio || 'No disponible'}</div>
                    <div className="text-sm text-gray-500">{patient.nombre_de_la_aseguradora || 'No disponible'}</div>
                  </td> */}
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
                      {getRiskLabel(patient.nivel_riesgo_global)}
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
      
      {/* Paginación removida - todos los datos se cargan de una vez */}
    </div>
  );
};