import React from 'react';
import { Filter, Search } from 'lucide-react';
import { Patient } from '../../types';

interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  convenienceFilter: string;
  onConvenienceFilterChange: (convenience: string) => void;
  riskFilter: string;
  onRiskFilterChange: (risk: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  patients: Patient[];
  gestionTypeFilter: string;
  onGestionTypeFilterChange: (value: string) => void;
  diagnosticoFilter: string;
  onDiagnosticoFilterChange: (value: string) => void;
  gestionTypes: string[];
  diagnosticoOptions: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  searchTerm,
  onSearchChange,
  convenienceFilter,
  onConvenienceFilterChange,
  riskFilter,
  onRiskFilterChange,
  statusFilter,
  onStatusFilterChange,
  patients,
  gestionTypeFilter,
  onGestionTypeFilterChange,
  diagnosticoFilter,
  onDiagnosticoFilterChange,
  gestionTypes,
  diagnosticoOptions,
}) => {
  // Obtener ISAPREs únicas de los pacientes
  const getUniqueISAPREs = () => {
    const isapres = new Set<string>();
    patients.forEach(patient => {
      if (patient.nombre_de_la_aseguradora && patient.nombre_de_la_aseguradora !== '-') {
        isapres.add(patient.nombre_de_la_aseguradora);
      }
    });
    return Array.from(isapres).sort();
  };

  const availableISAPREs = getUniqueISAPREs();

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Filter className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Filtros y Búsqueda</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Paciente
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre, RUT, episodio o diagnóstico..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Isapre
          </label>
          <select
            value={convenienceFilter}
            onChange={(e) => onConvenienceFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Isapres</option>
            {availableISAPREs.map((isapre) => (
              <option key={isapre} value={isapre}>
                {isapre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Gestión
          </label>
          <select
            value={gestionTypeFilter}
            onChange={(e) => onGestionTypeFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las gestiones</option>
            {gestionTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnóstico
          </label>
          <select
            value={diagnosticoFilter}
            onChange={(e) => onDiagnosticoFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los diagnósticos</option>
            {diagnosticoOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de Riesgo
          </label>
          <select
            value={riskFilter}
            onChange={(e) => onRiskFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los riesgos</option>
            <option value="verde">Bajo</option>
            <option value="amarillo">Medio</option>
            <option value="rojo">Alto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="alta_pendiente">Alta Pendiente</option>
            <option value="dado_alta">Dado de Alta</option>
          </select>
        </div>
      </div>
    </div>
  );
};